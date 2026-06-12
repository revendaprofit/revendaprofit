import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Package, 
  Tags, 
  Truck, 
  Settings, 
  LogOut, 
  Menu,
  X,
  ShoppingCart,
  Users,
  Receipt,
  Box,
  Star,
  Clock,
  ShieldAlert,
  ClipboardList,
  ShoppingBag,
  Settings2,
  Briefcase,
  Ticket,
  PiggyBank,
  Sparkles,
  MapPin,
  Lock,
  Video,
  LineChart,
  Handshake,
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import NotificationsPopover from "@/components/notifications/NotificationsPopover";
import ImageDownloadProgress from "@/components/stock/ImageDownloadProgress";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, isActive, onClick, disabled }: SidebarItemProps) => {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-not-allowed opacity-50 text-muted-foreground">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
      {label}
    </Link>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user, role } = useAuth();

  const isAdminMaster = user?.email === 'revendaprofit@gmail.com';

  // Navigation for store owners (default)
  const storeNavigation = [
    [
      ...(isAdminMaster ? [{ name: "Franquia (Admin)", href: "/admin", icon: ShieldAlert }] : []),
      { name: "Dashboard", href: "/", icon: Home },
      { name: "Analytics", href: "/analytics", icon: LineChart },
    ],
    [
      { name: "Minha Loja", href: "/settings", icon: Settings },
      { name: "Bolsas Consignadas", href: "/consignment-bags", icon: Briefcase },
      { name: "Fila de Espera", href: "/waitlist", icon: Clock },
      { name: "Modo Evento", href: "/event-mode", icon: Ticket, disabled: true },
      { name: "Consórcios", href: "/consortiums", icon: PiggyBank },
      { name: "Bazar VIP", href: "/bazar-admin", icon: Sparkles },
      { name: "Pontos Parceiros", href: "/partner-points", icon: MapPin },
    ],
    [
      { name: "Pedidos da Loja", href: "/orders", icon: Box },
      { name: "Estoque", href: "/stock", icon: Package },
      { name: "Hub de Fornecedores", href: "/hub", icon: ShoppingBag },
      { name: "Pedidos Hub", href: "/hub/orders", icon: ClipboardList },
    ],
    [
      { name: "Clientes", href: "/customers", icon: Users },
      { name: "Categorias", href: "/categories", icon: Tags },
      { name: "Fornecedores", href: "/suppliers", icon: Truck },
    ],
    [
      { name: "Produtos em Destaque", href: "/featured-products", icon: Star },
      { name: "Área Secreta", href: "/secret-area", icon: Lock, disabled: true },
      { name: "Vídeo Vendedor", href: "/video-seller", icon: Video, disabled: true },
    ],
    [
      { name: "Historico de Vendas", href: "/sales", icon: Receipt },
      { name: "Vendas a Prazo", href: "/installments", icon: Clock },
    ],
    [
      { name: "Parcerias", href: "/partner-agreements", icon: Handshake },
      { name: "Acerto de Contas", href: "/partner-settlement", icon: Calculator },
    ]
  ];

  // Navigation for suppliers
  const supplierNavigation = [
    [
      { name: "Painel", href: "/supplier", icon: Home },
      { name: "Meu Catalogo Hub", href: "/supplier/catalog", icon: Package },
      { name: "Regras Comerciais", href: "/supplier/trade-rules", icon: Settings2 },
      { name: "Pedidos Recebidos", href: "/supplier/orders", icon: ClipboardList },
    ]
  ];

  const isSupplier = role === 'supplier';
  const navigation = isSupplier ? supplierNavigation : storeNavigation;
  const brandColor = isSupplier ? 'amber' : 'primary';

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-100 border-r border-slate-200 transition-transform duration-300 lg:static lg:translate-x-0 flex flex-col",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isSupplier ? "bg-amber-500" : "bg-primary")}>
              <span className="text-primary-foreground font-black text-lg">{isSupplier ? 'F' : 'P'}</span>
            </div>
            {isSupplier ? (
              <>Hub <span className="text-amber-500">Fornecedor</span></>
            ) : (
              <>Revenda <span className="text-primary">Profit</span></>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!isSupplier && (
          <div className="px-4 pt-6 pb-2">
             <Link 
               to="/pos" 
               onClick={() => setIsMobileOpen(false)}
               className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:scale-95"
             >
               <ShoppingCart className="w-5 h-5" />
               Registrar Venda
             </Link>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto w-full px-4 py-4 space-y-5">
          {navigation.map((group, groupIdx) => {
            const hasBorder = groupIdx > 0 || isSupplier;
            return (
              <div 
                key={groupIdx} 
                className={cn(
                  "space-y-0.5",
                  hasBorder ? (isSupplier ? "bg-white border-2 border-amber-500 rounded-[1.25rem] p-1.5 shadow-sm" : "bg-white border-2 border-primary rounded-[1.25rem] p-1.5 shadow-sm") : ""
                )}
              >
                {group.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    isActive={location.pathname === item.href}
                    onClick={() => setIsMobileOpen(false)}
                    disabled={"disabled" in item ? !!(item as any).disabled : false}
                  />
                ))}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="mb-4 px-3 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium", isSupplier ? "bg-amber-100 text-amber-700" : "bg-secondary")}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{isSupplier ? 'Fornecedor' : 'Administrador'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair do sistema
          </Button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        {/* Header - Visible on both Mobile and Desktop now */}
        <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 border-b border-slate-200/60 bg-white/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center">
             <Button 
               variant="ghost" 
               size="icon" 
               className="lg:hidden mr-2" 
               onClick={() => setIsMobileOpen(true)}
             >
               <Menu className="h-6 w-6" />
             </Button>
             <span className="font-black tracking-tight text-slate-800 lg:hidden">{isSupplier ? 'Hub Fornecedor' : 'Revenda Profit'}</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
             <NotificationsPopover />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </div>
        <ImageDownloadProgress />
      </main>
    </div>
  );
}
