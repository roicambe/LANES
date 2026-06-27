"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";

export default function ProfileSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600">Email Address</label>
          <p className="font-medium text-gray-900">user@example.com</p>
        </div>
        <Button variant="ghost" className="text-blue-600 px-0 hover:bg-transparent hover:underline">
          Change Password
        </Button>
      </CardContent>
    </Card>
  );
}
