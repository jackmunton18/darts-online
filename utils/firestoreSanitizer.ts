/**
 * Utility to sanitize and prepare data for Firestore storage
 * Handles nested objects, arrays, dates, timestamps, and invalid values
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Deep sanitize an object to ensure all values are Firestore compatible
 * Handles nested objects, arrays, dates, and invalid values like NaN and Infinity
 */
export const deepSanitize = (obj: any): any => {
    // Handle null/undefined
    if (obj === null || obj === undefined) return null;
    
    // Handle primitive types
    if (typeof obj !== 'object') {
        // Convert NaN or Infinity to null (Firestore can't handle these)
        if (typeof obj === 'number' && (isNaN(obj) || !isFinite(obj))) {
            console.warn('⚠️ Converting NaN/Infinity to null');
            return null;
        }
        return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => deepSanitize(item));
    }
    
    // Check for Firestore Timestamp objects - leave them as is
    if (obj.toDate && typeof obj.toDate === 'function') {
        return obj;
    }
    
    // Handle Date objects
    if (obj instanceof Date) {
        return Timestamp.fromDate(obj);
    }
    
    // Handle regular objects
    const result: any = {};
    for (const key in obj) {
        // Skip functions or other non-serializable types
        if (typeof obj[key] === 'function') {
            console.warn('⚠️ Removing function from data at key:', key);
            continue;
        }
        
        // Skip undefined values
        if (obj[key] === undefined) {
            console.warn('⚠️ Skipping undefined value for key:', key);
            continue;
        }
        
        // Recursively sanitize objects
        result[key] = deepSanitize(obj[key]);
    }
    return result;
};
