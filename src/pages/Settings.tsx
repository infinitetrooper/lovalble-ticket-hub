import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AgentsSettings from "./settings/AgentsSettings";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="agents" className="w-full">
          <TabsList>
            <TabsTrigger value="agents">Agents</TabsTrigger>
          </TabsList>
          <TabsContent value="agents">
            <AgentsSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
