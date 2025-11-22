"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, validateEmail, validatePassword } from "@/client/helpers";
import type { RegisterRequest } from "@/shared/request";
import { UserRole } from "@/shared/enums";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  FormField,
  ErrorAlert,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components";

export function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterRequest>({
    name: "",
    email: "",
    password: "",
    role: UserRole.CASHIER,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = "Name is required";
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError("");

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      alert("Registration successful! Check your email for activation link.");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorAlert message={error} />
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <FormField label="Name" htmlFor="name" required error={errors.name}>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email}>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </FormField>
          <FormField label="Password" htmlFor="password" required error={errors.password}>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </FormField>
          <FormField label="Role" htmlFor="role" required>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                <SelectItem value={UserRole.WAREHOUSE_MANAGER}>Warehouse Manager</SelectItem>
                <SelectItem value={UserRole.CASHIER}>Cashier</SelectItem>
                <SelectItem value={UserRole.FINANCE}>Finance</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </div>
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => router.push("/login")}
            >
              Already have an account? Login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
