export interface LoginPayload {
  username: string;
  password: string;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

export interface ForgetPasswordPayload {
  username: string;
  email: string;
  new_password: string;
}
