import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { 
  confirmResetPassword,
  confirmSignUp,
  fetchAuthSession, 
  fetchUserAttributes,
  FetchUserAttributesOutput,
  resendSignUpCode,
  resetPassword,
  signIn, 
  signOut, 
  signUp
} from "aws-amplify/auth";
import { useCreateUserMutation } from "../api";

// Types
interface LoginInput {
  username: string;
  password: string;
}

interface SignUpInput {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  agencyId?: string;
}

interface VerificationInput {
  username: string;
  code: string;
}

interface ResetPasswordInput {
  username: string;
}

interface ConfirmResetPasswordInput {
  username: string;
  newPassword: string;
  confirmationCode: string;
}

interface UserInfo {
  cognitoId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  agencyId?: string;
}

interface AuthState {
  user: FetchUserAttributesOutput | null;
  userInfo: UserInfo | null;
  token: string;
  isLoggedIn: boolean;
  isVerificationStep: boolean;
  isPasswordReset: boolean;
  error: string | null;
  loading: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  userInfo: null,
  token: "",
  isLoggedIn: false,
  isVerificationStep: false,
  isPasswordReset: false,
  error: null,
  loading: false,
};

// Async Thunks
export const initializeAuth = createAsyncThunk(
  "auth/initializeAuth",
  async (_, { rejectWithValue }) => {
    try {
      const session = await fetchAuthSession();
      const newToken = session.tokens?.idToken?.toString() || "";
      
      if (session && newToken) {
        const userAttributes = await fetchUserAttributes();
        return { 
          isLoggedIn: true, 
          user: userAttributes, 
          token: newToken 
        };
      }
      
      return { 
        isLoggedIn: false, 
        user: null, 
        token: "" 
      };
    } catch (err) {
      return rejectWithValue("Failed to initialize auth");
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ username, password }: LoginInput, { rejectWithValue, dispatch }) => {
    try {
      const response = await signIn({
        username,
        password,
      });
      
      if (response.nextStep.signInStep === "CONFIRM_SIGN_UP") {
        return { 
          isVerificationStep: true, 
          email: username 
        };
      }
      
      const userAttributes = await fetchUserAttributes();
      localStorage.setItem("user", JSON.stringify(userAttributes));
      
      const session = await fetchAuthSession();
      const newToken = session.tokens?.idToken?.toString() || "";
      sessionStorage.setItem("token", newToken);
      
      return { 
        isLoggedIn: true, 
        user: userAttributes, 
        token: newToken,
        isVerificationStep: false 
      };
    } catch (error: any) {
      return rejectWithValue(error.toString());
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await signOut();
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("datasets");
      localStorage.removeItem("assistants");
      localStorage.removeItem("currentWorkspace");
      
      return { success: true };
    } catch (error: any) {
      return rejectWithValue(error.toString());
    }
  }
);

export const signupUser = createAsyncThunk(
  "auth/signup",
  async (userData: SignUpInput, { rejectWithValue }) => {
    try {
      console.log("userData", userData);
      const { isSignUpComplete,userId } = await signUp({
        username: userData.username,
        password: userData.password,
        options: {
          userAttributes: {
            email: userData.email,
          },
        },
      });
      console.log("isSignUpComplete", isSignUpComplete);
      return { 
        isSignUpComplete,
        user: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          cognitoId: userId
        } 
      };
    } catch (error: any) {
      return rejectWithValue(error.toString());
    }
  }
);

export const verifyCode = createAsyncThunk(
  "auth/verifyCode",
  async ({ username, code }: VerificationInput, { rejectWithValue, dispatch }) => {
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username,
        confirmationCode: code,
      });

      // Don't try to use the hook here - this will be handled elsewhere
      // or you need to use a different approach to create the user

      return { isSignUpComplete };
    } catch (error: any) {
      return rejectWithValue(error.toString());
    }
  }
);

export const resendVerificationCode = createAsyncThunk(
  "auth/resendVerificationCode",
  async (username: string, { rejectWithValue }) => {
    try {
      console.log("resending verification code for username", username);
      await resendSignUpCode({ username });
      console.log("verification code resent");
      return { success: true };
    } catch (error: any) {
      console.log("error resending verification code", error);
      return rejectWithValue(error.toString());
    }
  }
);

export const resetAuthPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ username }: ResetPasswordInput, { rejectWithValue }) => {
    try {
      await resetPassword({ username });
      return { 
        success: true,
        email: username 
      };
    } catch (error: any) {
      return rejectWithValue(error.toString());
    }
  }
);

export const confirmAuthResetPassword = createAsyncThunk(
  "auth/confirmResetPassword",
  async ({ username, newPassword, confirmationCode }: ConfirmResetPasswordInput, { rejectWithValue }) => {
    try {
      await confirmResetPassword({ username, newPassword, confirmationCode });
      return { success: true };
    } catch (error: any) {
      return rejectWithValue(error.toString());
    }
  }
);

// Auth Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isLoggedIn = action.payload.isLoggedIn;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.user = null;
        state.token = "";
        state.error = action.payload as string;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        if (action.payload.isVerificationStep) {
          state.isVerificationStep = true;
          state.user = { ...state.user, email: action.payload.email };
        } else {
          state.isLoggedIn = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isVerificationStep = false;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.user = null;
        state.token = "";
        state.isVerificationStep = false;
        state.isPasswordReset = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        if (action.payload.isSignUpComplete) {
          state.isVerificationStep = false;
        } else {
          state.isVerificationStep = true;
        }
        state.user = { ...state.user, ...action.payload.user };
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Verify Code
      .addCase(verifyCode.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyCode.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        if (action.payload.isSignUpComplete) {
          state.isVerificationStep = false;
        }
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Resend Code
      .addCase(resendVerificationCode.pending, (state) => {
        state.loading = true;
      })
      .addCase(resendVerificationCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendVerificationCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reset Password
      .addCase(resetAuthPassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(resetAuthPassword.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isPasswordReset = true;
        state.user = { ...state.user, email: action.payload.email };
      })
      .addCase(resetAuthPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Confirm Reset Password
      .addCase(confirmAuthResetPassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(confirmAuthResetPassword.fulfilled, (state) => {
        state.loading = false;
        state.isPasswordReset = false;
      })
      .addCase(confirmAuthResetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;