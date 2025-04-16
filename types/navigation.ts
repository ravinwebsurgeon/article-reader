export interface MenuItem {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onPress?: () => void;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface UserProfile {
  name: string;
  avatar: string;
}

