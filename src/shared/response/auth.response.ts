export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
}
