import React, { useState } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap"
import { getFirebaseBackend } from "../../../helpers/firebase_helper"
import { getAuth, updatePassword } from "firebase/auth"
import { useSelector, useDispatch } from "react-redux"
import { doc, updateDoc, getFirestore } from "firebase/firestore"

const ForcePasswordChangeModal = ({ isOpen }) => {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Acessar dados do tenant/branch/user da store
    // Nota: Precisamos garantir que idTenant e idBranch estejam disponíveis no contexto ou store
    // Geralmente 'Layout' tem acesso ao profile.
    // Vamos tentar pegar do Redux Profile ou Auth.

    // Assumindo que o profile está no Redux state "Profile"
    const { userProfile } = useSelector(state => ({
        userProfile: state.Profile.userProfile
    }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccess(false)

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.")
            return
        }

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.")
            return
        }

        setLoading(true)

        try {
            const auth = getAuth()
            const currentUser = auth.currentUser

            if (!currentUser) {
                throw new Error("Usuário não autenticado.")
            }

            // 1. Atualizar Senha no Auth
            await updatePassword(currentUser, password)

            // 2. Atualizar flag no Firestore
            // Caminho: tenants/{idTenant}/branches/{idBranch}/staff/{uid}
            // Precisamos pegar tenant/branch do profile ou da URL. 
            // Se userProfile tiver idTenant e idBranch, ótimo.

            if (userProfile && userProfile.idTenant && userProfile.idBranch) {
                const db = getFirestore()
                const staffRef = doc(db, "tenants", userProfile.idTenant, "branches", userProfile.idBranch, "staff", currentUser.uid)

                await updateDoc(staffRef, {
                    isFirstAccess: false,
                    updatedAt: new Date()
                })

                setSuccess(true)

                // Pequeno delay para usuário ler a mensagem antes de recarregar/fechar
                setTimeout(() => {
                    window.location.reload() // Recarrega para aplicar novo estado (modal some)
                }, 1500)

            } else {
                // Fallback: Se não tiver contexto, talvez erro? 
                // Mas a senha foi trocada.
                // Tentar atualizar apenas se possível.
                console.warn("Contexto de tenant/branch não encontrado no profile. Senha alterada, mas flag não atualizada.")
                setSuccess(true)
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            }

        } catch (err) {
            console.error("Erro ao alterar senha:", err)
            setError("Erro ao alterar senha: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} backdrop="static" keyboard={false} centered>
            <ModalHeader className="bg-primary text-white">
                Alteração de Senha Obrigatória
            </ModalHeader>
            <ModalBody>
                <p className="text-muted">
                    Este é seu primeiro acesso. Por segurança, você deve redefinir sua senha (diferente de <strong>123456</strong>).
                </p>

                {error && <Alert color="danger">{error}</Alert>}
                {success && <Alert color="success">Senha alterada com sucesso! Redirecionando...</Alert>}

                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label>Nova Senha</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite a nova senha"
                            required
                            minLength={6}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Confirmar Nova Senha</Label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirme a nova senha"
                            required
                            minLength={6}
                        />
                    </FormGroup>
                    <div className="d-grid">
                        <Button color="primary" type="submit" disabled={loading || success}>
                            {loading ? "Salvando..." : "Alterar Senha e Acessar"}
                        </Button>
                    </div>
                </Form>
            </ModalBody>
        </Modal>
    )
}

export default ForcePasswordChangeModal
