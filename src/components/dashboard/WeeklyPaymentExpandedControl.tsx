
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import useUserDataService from "@/services/userDataService";
import { PlanoSemanal } from "@/types/payment";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const WeeklyPaymentExpandedControl: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const { getPlanos, savePlanos, getAtendimentos } = useUserDataService();
  const [planos, setPlanos] = useState<PlanoSemanal[]>([]);

  useEffect(() => {
    loadPlanos();
  }, []);

  useEffect(() => {
    const handlePlanosUpdated = () => {
      loadPlanos();
    };

    window.addEventListener('atendimentosUpdated', handlePlanosUpdated);
    window.addEventListener('planosUpdated', handlePlanosUpdated);
    window.addEventListener('monthlyPaymentsUpdated', handlePlanosUpdated);
    
    return () => {
      window.removeEventListener('atendimentosUpdated', handlePlanosUpdated);
      window.removeEventListener('planosUpdated', handlePlanosUpdated);
      window.removeEventListener('monthlyPaymentsUpdated', handlePlanosUpdated);
    };
  }, []);

  const loadPlanos = () => {
    const allPlanos = getPlanos();
    const atendimentos = getAtendimentos();
    const existingClientNames = new Set(atendimentos.map(a => a.nome));
    
    // CARREGAR TODOS OS PLANOS SEMANAIS - PAGOS E PENDENTES
    const weeklyPlanos = allPlanos.filter((plano): plano is PlanoSemanal => 
      plano.type === 'semanal' && 
      !plano.analysisId &&
      existingClientNames.has(plano.clientName)
    );

    setPlanos(weeklyPlanos);
  };

  const handlePaymentToggle = (planoId: string, clientName: string, isPaid: boolean) => {
    const allPlanos = getPlanos();
    const updatedPlanos = allPlanos.map(plano => 
      plano.id === planoId ? { ...plano, active: !isPaid } : plano
    );
    
    savePlanos(updatedPlanos);
    toast.success(
      isPaid 
        ? `Pagamento de ${clientName} marcado como pago!`
        : `Pagamento de ${clientName} marcado como pendente!`
    );
    
    // SINCRONIZAÇÃO AUTOMÁTICA - Disparar múltiplos eventos para todos os controles
    setTimeout(() => {
      window.dispatchEvent(new Event('atendimentosUpdated'));
      window.dispatchEvent(new Event('planosUpdated'));
      window.dispatchEvent(new Event('monthlyPaymentsUpdated'));
      loadPlanos();
    }, 100);
  };

  const toggleClientExpansion = (clientName: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName);
    } else {
      newExpanded.add(clientName);
    }
    setExpandedClients(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Agrupar planos por cliente
  const groupedPlanos = planos.reduce((acc, plano) => {
    if (!acc[plano.clientName]) {
      acc[plano.clientName] = [];
    }
    acc[plano.clientName].push(plano);
    return acc;
  }, {} as Record<string, PlanoSemanal[]>);

  return (
    <div className="payment-controls-container payment-control-visible mb-6 w-full block">
      <Card className="payment-control-section border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/50 shadow-lg w-full">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-emerald-50/80 transition-colors pb-3 border-b border-emerald-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-emerald-700">
                  <div className="p-2 rounded-full bg-emerald-100">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Controle de Pagamentos Semanais</h3>
                    <p className="text-sm text-emerald-600 font-normal">
                      {Object.keys(groupedPlanos).length} cliente(s) ativo(s)
                    </p>
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-emerald-100 text-emerald-800 border-emerald-200 text-base px-3 py-1"
                  >
                    {planos.length}
                  </Badge>
                  <ChevronDown className={cn(
                    "h-6 w-6 text-emerald-600 transition-transform duration-300",
                    isOpen && "rotate-180"
                  )} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-4 px-6 pb-6">
              {Object.keys(groupedPlanos).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Nenhum pagamento semanal ativo</p>
                  <p className="text-sm mt-2">Os pagamentos aparecerão aqui quando houver planos semanais ativos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedPlanos).map(([clientName, clientPlanos]) => (
                    <div key={clientName} className="border border-emerald-200 rounded-lg bg-white shadow-sm">
                      <div 
                        className="p-4 cursor-pointer hover:bg-emerald-50/50 transition-colors flex items-center justify-between"
                        onClick={() => toggleClientExpansion(clientName)}
                      >
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-emerald-900 text-lg">{clientName}</h4>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            {clientPlanos.length} pagamento(s)
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="p-1">
                          {expandedClients.has(clientName) ? (
                            <ChevronUp className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-emerald-600" />
                          )}
                        </Button>
                      </div>
                      
                      {expandedClients.has(clientName) && (
                        <div className="border-t border-emerald-100 bg-emerald-50/30">
                          <div className="p-4 space-y-3">
                            {clientPlanos.map((plano) => {
                              const daysOverdue = getDaysOverdue(plano.dueDate);
                              const isOverdue = daysOverdue > 0;
                              const isPaid = !plano.active;
                              
                              return (
                                <div 
                                  key={plano.id} 
                                  className={cn(
                                    "border-l-4 p-4 rounded-lg transition-all duration-200",
                                    isPaid 
                                      ? "border-l-green-500 bg-green-50"
                                      : isOverdue
                                      ? "border-l-red-500 bg-red-50"
                                      : "border-l-emerald-500 bg-white"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                          {plano.week}ª Semana
                                        </Badge>
                                        {isOverdue && !isPaid && (
                                          <Badge variant="destructive">
                                            {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'} atrasado
                                          </Badge>
                                        )}
                                        {isPaid && (
                                          <Badge className="bg-green-100 text-green-800 border-green-200">
                                            ✓ Pago
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                                        <div>
                                          <span className="font-medium text-green-600">Valor:</span>
                                          <span className="ml-1 font-bold">R$ {plano.amount.toFixed(2)}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-orange-600">Vencimento:</span>
                                          <span className="ml-1 font-bold">{formatDate(plano.dueDate)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() => handlePaymentToggle(plano.id, clientName, !isPaid)}
                                      size="sm"
                                      className={cn(
                                        "transition-all duration-200 ml-4",
                                        isPaid
                                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                                          : "bg-green-600 hover:bg-green-700 text-white"
                                      )}
                                    >
                                      {isPaid ? (
                                        <>
                                          <X className="h-4 w-4 mr-1" />
                                          Pendente
                                        </>
                                      ) : (
                                        <>
                                          <Check className="h-4 w-4 mr-1" />
                                          Pagar
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default WeeklyPaymentExpandedControl;
