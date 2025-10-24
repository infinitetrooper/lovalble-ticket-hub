import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Phone, Globe, Share2 } from "lucide-react";

type TicketChannel = "email" | "chat" | "phone" | "web" | "social";

interface ChannelBadgeProps {
  channel: TicketChannel;
}

export const ChannelBadge = ({ channel }: ChannelBadgeProps) => {
  const variants: Record<TicketChannel, { label: string; icon: React.ReactNode }> = {
    email: {
      label: "Email",
      icon: <Mail className="h-3 w-3" />,
    },
    chat: {
      label: "Chat",
      icon: <MessageCircle className="h-3 w-3" />,
    },
    phone: {
      label: "Phone",
      icon: <Phone className="h-3 w-3" />,
    },
    web: {
      label: "Web",
      icon: <Globe className="h-3 w-3" />,
    },
    social: {
      label: "Social",
      icon: <Share2 className="h-3 w-3" />,
    },
  };

  const { label, icon } = variants[channel];

  return (
    <Badge variant="outline" className="gap-1">
      {icon}
      {label}
    </Badge>
  );
};
