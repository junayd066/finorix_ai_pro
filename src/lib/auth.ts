import { User, AuthSession } from "@/types";
import { generateDeviceFingerprint, storeFingerprint } from "./fingerprint";

const USERS_KEY = "trading_users";
const SESSION_KEY = "trading_session";

/**
 * Get all users from localStorage
 */
export const getUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

/**
 * Save users to localStorage
 */
export const saveUsers = (users: User[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * Add a new user
 */
export const addUser = (username: string, password: string, validity: "lifetime" | number): User => {
  const users = getUsers();
  
  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    password, // In production, this should be hashed
    validity,
    createdAt: new Date().toISOString(),
    expiresAt: validity === "lifetime" ? undefined : new Date(Date.now() + validity * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

/**
 * Update user device hash
 */
export const updateUserDevice = (userId: string, deviceHash: string): void => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].deviceHash = deviceHash;
    saveUsers(users);
  }
};

/**
 * Login user
 */
export const login = async (username: string, password: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return { success: false, error: "Invalid username or password" };
  }
  
  // Check if account is expired
  if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
    return { success: false, error: "Your subscription has expired. Please contact admin." };
  }
  
  // Generate and verify device fingerprint
  const deviceHash = await generateDeviceFingerprint();
  
  if (user.deviceHash && user.deviceHash !== deviceHash) {
    return { success: false, error: "Invalid credentials - device mismatch. Contact admin." };
  }
  
  // First login - store device hash
  if (!user.deviceHash) {
    updateUserDevice(user.id, deviceHash);
    storeFingerprint(deviceHash);
  }
  
  // Create session
  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    expiresAt: user.expiresAt || "lifetime",
    deviceHash,
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  storeFingerprint(deviceHash);
  
  return { success: true, session };
};

/**
 * Logout user
 */
export const logout = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

/**
 * Get current session
 */
export const getSession = (): AuthSession | null => {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  
  const parsedSession: AuthSession = JSON.parse(session);
  
  // Check if session is expired
  if (parsedSession.expiresAt !== "lifetime" && new Date(parsedSession.expiresAt) < new Date()) {
    logout();
    return null;
  }
  
  return parsedSession;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getSession() !== null;
};

/**
 * Get user by ID
 */
export const getUserById = (userId: string): User | undefined => {
  const users = getUsers();
  return users.find(u => u.id === userId);
};

/**
 * Update user
 */
export const updateUser = (userId: string, updates: Partial<User>): void => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updates };
    
    // Recalculate expiry if validity changed
    if (updates.validity !== undefined) {
      if (updates.validity === "lifetime") {
        users[userIndex].expiresAt = undefined;
      } else {
        users[userIndex].expiresAt = new Date(Date.now() + updates.validity * 24 * 60 * 60 * 1000).toISOString();
      }
    }
    
    saveUsers(users);
  }
};

/**
 * Delete user
 */
export const deleteUser = (userId: string): void => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  saveUsers(filteredUsers);
};

/**
 * Initialize with demo users if none exist
 */
export const initializeDemoUsers = (): void => {
  const users = getUsers();
  if (users.length === 0) {
    addUser("demo", "demo123", 30);
    addUser("trader1", "pass123", "lifetime");
  }
};
