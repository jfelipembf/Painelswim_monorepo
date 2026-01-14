import React, { useState, useEffect, useCallback } from "react"
import { Form, FormGroup, Label, Input, Alert } from "reactstrap"
import { useSelector } from "react-redux"
import { httpsCallable } from "firebase/functions"
import { getFirebaseFunctions } from "../../../../helpers/firebase_helper"

// Custom Components
import ButtonLoader from "../../../../components/Common/ButtonLoader"
import { useToast } from "../../../../components/Common/ToastProvider"

const IntegrationForm = ({ selected }) => {
    const { idBranch } = useSelector(state => state.Branch)
    const { tenant } = useSelector(state => state.Tenant)
    const idTenant = tenant?.idTenant || tenant?.id || localStorage.getItem("idTenant")
    const [formData, setFormData] = useState({})
    const [loading, setLoading] = useState(false)

    // Global Toast Hook
    const toast = useToast()

    const fetchConfig = useCallback(async () => {
        if (!selected || !idBranch) return
        setLoading(true)
        try {
            const functions = getFirebaseFunctions()
            const getConfig = httpsCallable(functions, 'getIntegrationConfig')
            const result = await getConfig({ integrationId: selected, idBranch, idTenant })
            setFormData(result.data.config || {})
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro", description: "Erro ao carregar configurações.", color: "danger" })
        } finally {
            setLoading(false)
        }
    }, [selected, idBranch, idTenant, toast])

    useEffect(() => {
        fetchConfig()
    }, [fetchConfig])

    const renderFields = () => {
        switch (selected) {
            case "gemini":
                return (
                    <>
                        <h4 className="card-title mb-4">Configuração Google Gemini</h4>
                        <FormGroup>
                            <Label>API Key</Label>
                            <Input
                                type="password"
                                placeholder="Insira sua API Key do Google AI Studio"
                                value={formData.apiKey || ""}
                                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>Modelo Padrão</Label>
                            <Input
                                type="select"
                                value={formData.model || "gemini-pro"}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                            >
                                <option value="gemini-pro">Gemini Pro</option>
                                <option value="gemini-pro-vision">Gemini Pro Vision</option>
                            </Input>
                        </FormGroup>
                    </>
                )
            case "openai":
                return (
                    <>
                        <h4 className="card-title mb-4">Configuração OpenAI</h4>
                        <FormGroup>
                            <Label>API Key</Label>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={formData.apiKey || ""}
                                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>Modelo Padrão</Label>
                            <Input
                                type="select"
                                value={formData.model || "gpt-4"}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                            >
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </Input>
                        </FormGroup>
                    </>
                )
            case "evolution":
            case "evolution_financial":
                return (
                    <>
                        <h4 className="card-title mb-4">
                            {selected === "evolution" ? "Configuração Evolution AI (Whatsapp Clientes)" : "Configuração Robô de Despesas (Pessoal)"}
                        </h4>

                        <Alert color="info" className="mb-4">
                            <i className="mdi mdi-information-outline me-2"></i>
                            {selected === "evolution"
                                ? "Esta instância será usada para enviar mensagens automáticas de sistema (aniversários, agendamentos)."
                                : "Esta instância será usada para receber mensagens de despesas. Configure o 'Número Permitido' para garantir que apenas você possa cadastrar."
                            }
                        </Alert>

                        <FormGroup>
                            <Label>URL da Instância</Label>
                            <Input
                                type="url"
                                placeholder="https://api.seudominio.com"
                                value={formData.baseUrl || ""}
                                onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>API Key / Token</Label>
                            <Input
                                type="password"
                                placeholder="Token de autenticação global"
                                value={formData.apiKey || ""}
                                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>Nome da Instância (Ex: {selected === "evolution" ? "SwimMain" : "SwimFinance"})</Label>
                            <Input
                                type="text"
                                placeholder="Minha Instância"
                                value={formData.instanceName || ""}
                                onChange={e => setFormData({ ...formData, instanceName: e.target.value })}
                            />
                        </FormGroup>

                        {/* [NEW] Whitelist field only for Financial Bot */}
                        {selected === "evolution_financial" && (
                            <>
                                <FormGroup>
                                    <Label className="text-primary fw-bold">Gemini API Key (Inteligência)</Label>
                                    <Input
                                        type="password"
                                        placeholder="Chave do Google AI Studio"
                                        value={formData.geminiApiKey || ""}
                                        onChange={e => setFormData({ ...formData, geminiApiKey: e.target.value })}
                                    />
                                    <small className="text-muted">Necessária para ler e entender as despesas.</small>
                                </FormGroup>

                                <FormGroup>
                                    <Label className="text-danger fw-bold">Número Permitido (Seu WhatsApp)</Label>
                                    <Input
                                        type="text"
                                        placeholder="5511999999999"
                                        value={formData.allowedNumber || ""}
                                        onChange={e => setFormData({ ...formData, allowedNumber: e.target.value })}
                                    />
                                    <small className="text-muted">Apenas mensagens vindas deste número serão processadas.</small>
                                </FormGroup>
                            </>
                        )}
                    </>
                )
            default:
                return null
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!idBranch) {
            toast.show({ title: "Atenção", description: "Selecione uma filial para continuar.", color: "warning" })
            return
        }

        setLoading(true)

        try {
            const functions = getFirebaseFunctions()
            const saveConfig = httpsCallable(functions, 'saveIntegrationConfig')
            await saveConfig({ integrationId: selected, config: formData, idBranch, idTenant })
            toast.show({ title: "Sucesso", description: "Configurações salvas com sucesso!", color: "success" })
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro", description: e?.message || "Erro ao salvar configurações.", color: "danger" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form onSubmit={handleSave}>
            {!idBranch && (
                <Alert color="warning" className="mb-4">
                    <i className="mdi mdi-alert-outline me-2"></i>
                    Selecione uma filial no menu superior para gerenciar as integrações.
                </Alert>
            )}
            {renderFields()}

            <div className="d-flex justify-content-end mt-4">
                <ButtonLoader color="primary" type="submit" loading={loading}>
                    Salvar Configurações
                </ButtonLoader>
            </div>
        </Form>
    )
}

export default IntegrationForm
