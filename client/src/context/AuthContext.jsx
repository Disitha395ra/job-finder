import { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [userType, setUserType] = useState(null); // 'seeker' | 'company'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                await fetchUserProfile(user);
            } else {
                setUserProfile(null);
                setUserType(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const fetchUserProfile = async (user) => {
        try {
            const token = await user.getIdToken();

            // Try fetching seeker and company profiles in parallel for speed
            const [seekerResult, companyResult] = await Promise.allSettled([
                api.get('/users/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                api.get('/companies/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (seekerResult.status === 'fulfilled') {
                setUserProfile(seekerResult.value.data);
                setUserType('seeker');
                return 'seeker';
            }

            if (companyResult.status === 'fulfilled') {
                setUserProfile(companyResult.value.data);
                setUserType('company');
                return 'company';
            }

            // Neither profile found - new user or orphaned auth
            setUserProfile(null);
            setUserType(null);
            return null;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    };

    // Register job seeker
    const registerSeeker = async (email, password, fullName) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);

        // Create profile in backend
        await api.post('/users/register', {
            uid: userCredential.user.uid,
            fullName,
            email,
        });

        await fetchUserProfile(userCredential.user);
        return userCredential.user;
    };

    // Register company
    const registerCompany = async (email, password, companyName, description) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);

        // Create profile in backend
        await api.post('/companies/register', {
            uid: userCredential.user.uid,
            companyName,
            email,
            description,
        });

        await fetchUserProfile(userCredential.user);
        return userCredential.user;
    };

    // Login - returns the detected user type so login pages can navigate correctly
    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const detectedType = await fetchUserProfile(userCredential.user);
        return { user: userCredential.user, userType: detectedType };
    };

    // Logout
    const logout = async () => {
        await signOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
        setUserType(null);
    };

    // Get token
    const getToken = async () => {
        if (!currentUser) return null;
        return await currentUser.getIdToken();
    };

    const value = {
        currentUser,
        userProfile,
        userType,
        loading,
        registerSeeker,
        registerCompany,
        login,
        logout,
        getToken,
        fetchUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
