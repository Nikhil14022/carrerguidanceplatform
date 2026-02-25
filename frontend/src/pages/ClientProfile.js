import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // ✅ fetchData wrapped in useCallback
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/clients/${clientId}`, { credentials: "include" });
      const data = await res.json();
      setClient(data);

      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        notes: data.notes || "",
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Failed to load client profile");
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await fetch(`${API}/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      toast.success("Client profile updated successfully!");
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to save client profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading client profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-white border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors rounded-lg px-4 py-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-primary">Client Profile</h1>
          <p className="text-muted-foreground mt-1">{client.first_name} {client.last_name}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-card border border-border/50 shadow-sm rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">First Name</label>
            <Input
              value={formData.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              placeholder="First Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Last Name</label>
            <Input
              value={formData.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              placeholder="Last Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Email</label>
            <Input
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Phone Number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={4}
              placeholder="Additional notes"
            />
          </div>

          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-3 font-medium"
          >
            <Save className="mr-2 h-5 w-5" />
            Save Profile
          </Button>
        </Card>
      </main>
    </div>
  );
}
