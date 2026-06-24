"use client";

import { Card, CardHeader, CardTitle, CardContent } from "../../shared/ui/Card";

export default function SavedRoutesList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Routes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-500 italic">No saved routes yet.</p>
        {/* Placeholder for list of routes mapping origin to destination */}
      </CardContent>
    </Card>
  );
}
