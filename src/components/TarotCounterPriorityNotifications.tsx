import React, { memo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePaymentNotifications } from "@/components/tarot/payment-notifications/usePaymentNotifications";
import { ClientPaymentGroup } from "@/components/tarot/payment-notifications/ClientPaymentGroup";
import { useLocation } from "react-router-dom";
import PaymentDetailsModal from "@/components/PaymentDetailsModal";

interface TarotCounterPriorityNotificationsProps {
  analises: any[];
}

const TarotCounterPriorityNotifications: React.FC<TarotCounterPriorityNotificationsProps> = memo(({
  analises,
}) => {
  const location = useLocation();
  const { groupedPayments, markAsPaid, deleteNotification } = usePaymentNotifications();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Adicionar sincronização com controle de pagamentos
  useEffect(() => {
    const handleSyncUpdate = () => {
      console.log('TarotCounterPriorityNotifications - Sincronizando com controle de pagamentos');
      // Forçar refresh das notificações
      setTimeout(() => {
        window.dispatchEvent(new Event('tarot-payment-updated'));
      }, 100);
    };

    const events = ['planosUpdated', 'atendimentosUpdated', 'paymentStatusChanged'];
    events.forEach(event => {
      window.addEventListener(event, handleSyncUpdate);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleSyncUpdate);
      });
    };
  }, []);

  // Se não há notificações pendentes, não mostrar o componente
  if (groupedPayments.length === 0) {
    return null;
  }

  const paymentsToShow = groupedPayments;

  const handleViewDetails = (payment: any) => {
    console.log('TarotCounterPriorityNotifications - handleViewDetails called with payment:', payment);
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  // Só mostrar notificações de tarot nas páginas de tarot
  const isTarotPage = location.pathname.includes('listagem-tarot') || 
                      location.pathname.includes('analise-frequencial') || 
                      location.pathname.includes('editar-analise-frequencial') ||
                      location.pathname.includes('relatorio-geral-tarot') ||
                      location.pathname.includes('relatorio-individual-tarot');
  
  if (!isTarotPage) {
    return null;
  }

  return (
    <Card className="mb-6 border-tarot-primary bg-tarot-accent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 tarot-primary">
          <Bell className="h-5 w-5" />
          Próximos Vencimentos - Análises de Tarot
          <Badge variant="secondary" className="bg-tarot-primary text-white">
            {paymentsToShow.length} {paymentsToShow.length === 1 ? 'cliente' : 'clientes'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentsToShow.map((group, index) => (
          <ClientPaymentGroup
            key={`${group.clientName}-${group.mostUrgent.id}-${index}`}
            group={group}
            onMarkAsPaid={markAsPaid}
            onDeleteNotification={deleteNotification}
            onViewDetails={handleViewDetails}
          />
        ))}
      </CardContent>
      
      <PaymentDetailsModal
        payment={selectedPayment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMarkAsPaid={markAsPaid}
        onDeleteNotification={deleteNotification}
      />
    </Card>
  );
});

TarotCounterPriorityNotifications.displayName = 'TarotCounterPriorityNotifications';

export default TarotCounterPriorityNotifications;