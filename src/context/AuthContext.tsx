import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
    login: string;
    role: string;
    token: string;
}

interface AuthResponse {
    login: string;
    role: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (login: string, password: string) => Promise<void>;
    register: (login: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem("user");
            const token = localStorage.getItem("token");
            if (savedUser && token) {
                return JSON.parse(savedUser) as User;
            }
        } catch (e) {
            console.error("Failed to parse saved auth data", e);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        }
        return null;
    });

    useEffect(() => {
        if (user?.token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
        } else {
            delete axios.defaults.headers.common["Authorization"];
        }
    }, [user?.token]);

    const handleAuthData = (data: AuthResponse) => {
        const userData: User = {
            login: data.login,
            role: data.role,
            token: data.token,
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", data.token);
    };

    const login = async (login: string, password: string) => {
        const { data } = await axios.post<AuthResponse>("/api/auth/login", {
            login,
            password,
        });
        handleAuthData(data);
    };

    const register = async (login: string, password: string) => {
        const { data } = await axios.post<AuthResponse>("/api/auth/register", {
            login,
            password,
        });
        handleAuthData(data);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider
            value={{ 
                user, 
                isAuthenticated: !!user, 
                isAdmin: user?.role === "ADMIN",
                login, 
                register, 
                logout 
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
