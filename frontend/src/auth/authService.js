/**
 * Auth Service - API calls for authentication
 * Handles login, signup, and related operations
 */

import API_BASE from '../config';

/**
 * Login user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{success: boolean, data?: object, error?: string, token?: string}>}
 */
export async function loginUser(email, password) {
    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.message || 'Login failed' };
        }

        // Extract token from response (server now returns it directly)
        const token = data.token;
        const user = { ...data };
        delete user.token; // Remove token from user object

        return { success: true, data: user, token };
    } catch (err) {
        console.error('Login error:', err);
        return { success: false, error: 'Network error: backend not responding' };
    }
}

/**
 * Login with Google
 * @param {string} token - Google ID Token
 * @returns {Promise<{success: boolean, data?: object, error?: string, token?: string}>}
 */
export async function googleLogin(token) {
    try {
        const res = await fetch(`${API_BASE}/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.message || 'Google login failed' };
        }

        // Extract token from response
        const authToken = data.token;
        const user = { ...data };
        delete user.token;

        return { success: true, data: user, token: authToken };
    } catch (err) {
        console.error('Google Login error:', err);
        return { success: false, error: 'Network error: backend not responding' };
    }
}

/**
 * Register new user
 * @param {object} userData - {name, email, password, phone, role, hospitalId}
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function signupUser(userData) {
    try {
        const res = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.message || 'Signup failed' };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Signup error:', err);
        return { success: false, error: 'Network error: backend not responding' };
    }
}

/**
 * Admin-only login (Super Admin and Clinic Admin)
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{success: boolean, data?: object, error?: string, token?: string, redirectToClinicFinder?: boolean}>}
 */
export async function adminLogin(email, password) {
    try {
        const res = await fetch(`${API_BASE}/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            return { 
                success: false, 
                error: data.message || 'Login failed',
                redirectToClinicFinder: data.redirectToClinicFinder || false
            };
        }

        const token = data.token;
        const user = { ...data };
        delete user.token;

        return { success: true, data: user, token };
    } catch (err) {
        console.error('Admin login error:', err);
        return { success: false, error: 'Network error: backend not responding' };
    }
}

/**
 * Clinic-specific login for Patient, Doctor, Staff
 * @param {string} email 
 * @param {string} password 
 * @param {string} subdomain - Clinic subdomain
 * @param {string} role - 'patient', 'doctor', or 'receptionist'
 * @returns {Promise<{success: boolean, data?: object, error?: string, token?: string}>}
 */
export async function clinicLogin(email, password, subdomain, role) {
    try {
        const res = await fetch(`${API_BASE}/clinic-login/${subdomain}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        });

        const data = await res.json();

        if (!res.ok) {
            return { 
                success: false, 
                error: data.message || 'Login failed',
                approvalStatus: data.approvalStatus
            };
        }

        const token = data.token;
        const user = { ...data };
        delete user.token;

        return { success: true, data: user, token };
    } catch (err) {
        console.error('Clinic login error:', err);
        return { success: false, error: 'Network error: backend not responding' };
    }
}

/**
 * Clinic-specific signup for Patient, Doctor, Staff
 * @param {object} userData - {name, email, password, phone, role}
 * @param {string} subdomain - Clinic subdomain
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function clinicSignup(userData, subdomain) {
    try {
        const res = await fetch(`${API_BASE}/clinic-signup/${subdomain}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        const data = await res.json();

        if (!res.ok) {
            return { 
                success: false, 
                error: data.message || 'Signup failed',
                approvalStatus: data.approvalStatus
            };
        }

        // For patients, includes token. For doctor/staff, only approval status
        return { success: true, data };
    } catch (err) {
        console.error('Clinic signup error:', err);
        return { success: false, error: 'Network error: backend not responding' };
    }
}

/**
 * Clinic-specific Google login (Patients only)
 * @param {string} token - Google access token
 * @param {string} subdomain - Clinic subdomain
 * @returns {Promise<{success: boolean, data?: object, error?: string, token?: string}>}
 */
export async function clinicGoogleLogin(token, subdomain) {
    try {
        const res = await fetch(`${API_BASE}/clinic-google/${subdomain}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.message || 'Google login failed' };
        }

        const authToken = data.token;
        const user = { ...data };
        delete user.token;

        return { success: true, data: user, token: authToken };
    } catch (err) {
        console.error('Clinic Google login error:', err);
        return { success: false, error: 'Network error: backend not responding' };
    }
}


/**
 * Fetch patient data by user ID
 * @param {string} userId 
 * @returns {Promise<object|null>}
 */
export async function fetchPatientData(userId) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/patients/by-user/${userId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
            return await res.json();
        }
        return null;
    } catch (err) {
        console.warn('Could not fetch patient data:', err);
        return null;
    }
}

/**
 * Fetch doctor data by email
 * @param {string} email 
 * @returns {Promise<object|null>}
 */
export async function fetchDoctorData(email) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/doctors?email=${encodeURIComponent(email)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
            const doctors = await res.json();
            return Array.isArray(doctors) ? doctors.find(d => d.email === email) : null;
        }
        return null;
    } catch (err) {
        console.warn('Could not fetch doctor data:', err);
        return null;
    }
}

/**
 * Validation helpers
 */
export const validators = {
    email: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return 'Email is required';
        if (!re.test(email)) return 'Please enter a valid email address';
        return null;
    },

    password: (password) => {
        if (!password) return 'Password is required';
        if (password.length < 6) return 'Password must be at least 6 characters';
        return null;
    },

    name: (name) => {
        if (!name || !name.trim()) return 'Name is required';
        if (name.trim().length < 2) return 'Name must be at least 2 characters';
        return null;
    },

    phone: (phone) => {
        if (!phone) return 'Phone number is required';
        const digits = phone.replace(/\D/g, '');
        if (digits.length !== 10) return 'Please enter a valid 10-digit phone number';
        return null;
    },
};

/**
 * Format phone number for API (adds +91 if needed)
 * @param {string} phone 
 * @returns {string}
 */
export function formatPhone(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // If already has country code (starts with 91 and has 12 digits), just add +
    if (digits.startsWith('91') && digits.length === 12) {
        return `+${digits}`;
    }

    // If it's a 10-digit number, add +91
    if (digits.length === 10) {
        return `+91${digits}`;
    }

    // Fallback: just add + if not present
    return phone.startsWith('+') ? phone : `+${phone}`;
}

/**
 * Save auth data to localStorage
 * @param {object} user 
 * @param {string} token 
 * @param {string} subdomain - Optional clinic subdomain for clinic-scoped users
 */
export function saveAuthData(user, token, subdomain = null) {
    if (token) {
        localStorage.setItem('token', token);
    }

    const userId = user.id || user._id;
    if (userId) {
        localStorage.setItem('userId', userId);
        localStorage.setItem('userRole', user.role);
    }

    // Store clinic subdomain for clinic-scoped routes
    if (subdomain) {
        localStorage.setItem('clinicSubdomain', subdomain);
    }

    const authUser = {
        id: userId || null,
        _id: userId || null,
        email: user.email || '',
        role: user.role || '',
        name: user.name || '',
        profileCompleted: !!user.profileCompleted,
        mustChangePassword: user.mustChangePassword || false,
        clinicId: user.clinicId || user.clinic?._id || null,
        clinicName: user.clinicName || user.clinic?.name || user.clinic || '',
        clinicLogo: user.clinicLogo || user.clinic?.logo || '',
        clinicSubdomain: subdomain || user.clinicSubdomain || null,
        googleId: user.googleId || null, // Include googleId for Google login users
    };

    localStorage.setItem('authUser', JSON.stringify(authUser));
    return authUser;
}

/**
 * Save patient data to localStorage
 * @param {object} patientDoc 
 * @param {string} userId 
 */
export function savePatientData(patientDoc, userId) {
    const patientObj = {
        id: patientDoc._id || patientDoc.id || userId,
        _id: patientDoc._id || patientDoc.id || userId,
        userId: patientDoc.userId || userId,
        firstName: patientDoc.firstName || '',
        lastName: patientDoc.lastName || '',
        name: (patientDoc.firstName || patientDoc.lastName)
            ? `${patientDoc.firstName || ''} ${patientDoc.lastName || ''}`.trim()
            : patientDoc.name || '',
        email: patientDoc.email || '',
        phone: patientDoc.phone || '',
        clinic: patientDoc.clinic || '',
        clinicId: patientDoc.clinicId || null, // Include clinicId for auto-selecting clinic
        dob: patientDoc.dob || '',
        address: patientDoc.address || '',
    };

    localStorage.setItem('patient', JSON.stringify(patientObj));
    localStorage.setItem('patientId', patientObj.id);
}

/**
 * Save doctor data to localStorage
 * @param {object} doctorDoc 
 */
export function saveDoctorData(doctorDoc) {
    const doctorObj = {
        id: doctorDoc._id || doctorDoc.id,
        _id: doctorDoc._id || doctorDoc.id,
        firstName: doctorDoc.firstName || '',
        lastName: doctorDoc.lastName || '',
        name: (doctorDoc.firstName || doctorDoc.lastName)
            ? `${doctorDoc.firstName || ''} ${doctorDoc.lastName || ''}`.trim()
            : '',
        email: doctorDoc.email || '',
        phone: doctorDoc.phone || '',
        clinic: doctorDoc.clinic || '',
        clinicId: doctorDoc.clinicId || null,
        clinicName: doctorDoc.clinicName || doctorDoc.clinic || '',
        specialization: doctorDoc.specialization || '',
    };

    localStorage.setItem('doctor', JSON.stringify(doctorObj));
}

/**
 * Clear role-specific data from localStorage
 */
export function clearRoleData() {
    localStorage.removeItem('patient');
    localStorage.removeItem('patientId');
    localStorage.removeItem('doctor');
}

/**
 * Get stored JWT token
 * @returns {string|null}
 */
export function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Get headers object with Authorization token for API calls
 * @returns {object}
 */
export function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
}

/**
 * Logout user - clear all auth data
 */
export function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authUser');
    clearRoleData();
}

