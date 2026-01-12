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
                return (
                    <>
                        <h4 className="card-title mb-4">Configuração Evolution AI (WhatsApp)</h4>
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
                                placeholder="Token de autenticação"
                                value={formData.apiKey || ""}
                                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>Nome da Instância</Label>
                            <Input
                                type="text"
                                placeholder="Minha Instância"
                                value={formData.instanceName || ""}
                                onChange={e => setFormData({ ...formData, instanceName: e.target.value })}
                            />
                        </FormGroup>
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
