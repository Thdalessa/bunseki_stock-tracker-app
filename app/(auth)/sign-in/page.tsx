"use client";
import FooterLink from "@/components/forms/FooterLink";
import InputField from "@/components/forms/InputField";
import { Button } from "@/components/ui/button";
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

const SignIn = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<SignInFormData> = async (
    data: SignInFormData,
  ) => {
    try {
      const result = await signInWithEmail(data);
      if (result?.success) router.push("/");
    } catch (error) {
      toast.error("Sign in failed", {
        description:
          error instanceof Error ? error.message : "Failed to sign in.",
      });
    }
  };

  return (
    <div>
      <h1 className="form-title">Log in Your Account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Form fields will go here */}
        <InputField
          name="email"
          label="Email"
          placeholder="johndoe@gmail.com"
          register={register}
          error={errors.email}
          validation={{
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Please enter a valid email address",
            },
          }}
        />
        <InputField
          name="password"
          label="Password"
          type="password"
          placeholder="Enter a strong password"
          register={register}
          error={errors.password}
          validation={{
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          }}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
        <FooterLink
          text="Don't have an account?"
          linkText="Create an account"
          href="/sign-up"
        />
      </form>
    </div>
  );
};

export default SignIn;
