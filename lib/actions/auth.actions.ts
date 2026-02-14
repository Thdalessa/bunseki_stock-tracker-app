"use server";

import { headers } from "next/headers";
import { getAuth } from "../better-auth/auth";
import { inngest } from "../inngest/client";

export const signUpWithEmail = async ({
  email,
  password,
  fullName,
  country,
  investmentGoals,
  riskTolerance,
  preferredIndustry,
}: SignUpFormData) => {
  try {
    const auth = await getAuth();
    const response = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName,
      },
    });

    if (response) {
      try {
        await inngest.send({
          name: "app/user.created",
          data: {
            email: email,
            name: fullName,
            country: country,
            investmentGoals: investmentGoals,
            riskTolerance: riskTolerance,
            preferredIndustry: preferredIndustry,
          },
        });
      } catch (eventError) {
        // Log but don't fail signup - welcome email is non-critical
        console.error("Failed to dispatch user.created event:", eventError);
      }
      return { success: true };
    }
    return { success: false, error: "Sign up failed - no response from auth" };
  } catch (error) {
    console.error("Error during sign up:", error);
    return { success: false, error: "Sign up failed" };
  }
};

export const signOut = async () => {
  try {
    const auth = await getAuth();
    await auth.api.signOut({
      headers: await headers(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error during sign out:", error);
    return { success: false, error: "Sign out failed" };
  }
};

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    const auth = await getAuth();
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
    return { success: true, data: response };
  } catch (error) {
    console.error("Error during sign in:", error);
    return { success: false, error: "Sign in failed" };
  }
};
