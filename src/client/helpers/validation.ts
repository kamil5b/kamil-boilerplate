export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-+()]{10,}$/;
  return phoneRegex.test(phone);
}

export function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

export function validateRequired(value: any): string | null {
  if (value === null || value === undefined || value === "") {
    return "This field is required";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const requiredError = validateRequired(email);
  if (requiredError) return requiredError;
  
  if (!isValidEmail(email)) {
    return "Please enter a valid email address";
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null; // Phone is optional
  
  if (!isValidPhone(phone)) {
    return "Please enter a valid phone number";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  const requiredError = validateRequired(password);
  if (requiredError) return requiredError;
  
  if (!isStrongPassword(password)) {
    return "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number";
  }
  return null;
}

export function validateMin(value: number, min: number): string | null {
  if (value < min) {
    return `Value must be at least ${min}`;
  }
  return null;
}

export function validateMax(value: number, max: number): string | null {
  if (value > max) {
    return `Value must be at most ${max}`;
  }
  return null;
}
