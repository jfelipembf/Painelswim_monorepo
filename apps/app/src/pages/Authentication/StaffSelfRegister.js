import React, { useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { Container, Row, Col, Card, CardBody, Form, Label, Input, FormFeedback, Button, Spinner } from "reactstrap"
import { useFormik } from "formik"
import * as Yup from "yup"
import InputMask from "react-input-mask"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"

// Services & Helpers
import { createStaff, useStaffPhotoUpload } from "../../services/Staff/staff.service"
import { fetchAddressByCep } from "../../helpers/cep"
import { useToast } from "../../components/Common/ToastProvider"
import ButtonLoader from "../../components/Common/ButtonLoader"

// Assets
import logoSwim from "../../assets/images/logoSwim.png"
import bg from "../../assets/images/bg-1.png"

const StaffSelfRegister = () => {
    const { tenant: tenantSlug, branch: branchSlug } = useParams()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [ids, setIds] = useState({ idTenant: null, idBranch: null })
    const [loadingIds, setLoadingIds] = useState(true)
    const [loading, setLoading] = useState(false)
    const toast = useToast()

    // Photo State
    const [preview, setPreview] = useState(null)
    const [photoFile, setPhotoFile] = useState(null)
    const { uploadPhoto, uploading: uploadingPhoto } = useStaffPhotoUpload()
    const db = getFirestore()

    // Resolve Slugs to IDs
    React.useEffect(() => {
        const resolveContext = async () => {
            try {
                if (!tenantSlug || !branchSlug) return;
                setLoadingIds(true)

                // 1. Resolve Tenant Slug
                const tenantSlugDoc = await getDoc(doc(db, "tenantsBySlug", tenantSlug))
                if (!tenantSlugDoc.exists()) throw new Error("Academia não encontrada")
                const idTenant = tenantSlugDoc.data().idTenant

                // 2. Resolve Branch Slug
                // Branch slugs are not globally unique, so we query within the tenant's branches
                // Assuming branches have a 'slug' field. 
                const branchesRef = collection(db, "tenants", idTenant, "branches")
                const q = query(branchesRef, where("slug", "==", branchSlug))
                const querySnapshot = await getDocs(q)

                if (querySnapshot.empty) throw new Error("Unidade não encontrada")
                const idBranch = querySnapshot.docs[0].id

                setIds({ idTenant, idBranch })
            } catch (err) {
                console.error("Error resolving context:", err)
                toast.show({ title: "Erro", description: "Link inválido ou expirado.", color: "danger" })
                // navigate("/login") // Optional: redirect immediate or let them see the error
            } finally {
                setLoadingIds(false)
            }
        }
        resolveContext()
    }, [tenantSlug, branchSlug, db, toast]) // removed navigate to avoid loops if needed

    const auth = getAuth()

    const validation = useFormik({
        initialValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            gender: "Masculino",
            birthDate: "",

            cep: "",
            state: "",
            city: "",
            neighborhood: "",
            address: "",
            number: "",

            password: "",
            confirmPassword: ""
        },
        validationSchema: Yup.object({
            firstName: Yup.string().required("Nome é obrigatório"),
            lastName: Yup.string().required("Sobrenome é obrigatório"),
            email: Yup.string().email("E-mail inválido").required("E-mail é obrigatório"),
            phone: Yup.string().required("Telefone é obrigatório"),
            gender: Yup.string().required("Sexo é obrigatório"),
            birthDate: Yup.date().required("Data de nascimento é obrigatória"),

            cep: Yup.string().required("CEP é obrigatório"),
            state: Yup.string().required("Estado é obrigatório"),
            city: Yup.string().required("Cidade é obrigatória"),
            neighborhood: Yup.string().required("Bairro é obrigatório"),
            address: Yup.string().required("Endereço é obrigatório"),
            number: Yup.string().required("Número é obrigatório"),

            password: Yup.string().min(6, "A senha deve ter pelo menos 6 caracteres").required("Senha é obrigatória"),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password'), null], "As senhas devem coincidir")
                .required("Confirmação de senha é obrigatória")
        }),
        onSubmit: async (values) => {
            if (!ids.idTenant || !ids.idBranch) {
                toast.show({ title: "Erro", description: "Contexto da academia não carregado.", color: "danger" })
                return
            }

            setLoading(true)
            try {
                // 1. Create Auth User
                const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password)
                const user = userCredential.user

                let photoUrl = null
                // 2. Upload Photo (if selected)
                if (photoFile) {
                    // We need to wait a bit or ensure the user is auth'd for storage rules, 
                    // but creating the user usually signs them in automatically.
                    photoUrl = await uploadPhoto(photoFile, {
                        ctxOverride: { idTenant: ids.idTenant, idBranch: ids.idBranch }
                    })
                }

                // 3. Create Staff Document
                const staffData = {
                    id: user.uid,
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    phone: values.phone,
                    gender: values.gender,
                    birthDate: values.birthDate,

                    address: {
                        zip: values.cep,
                        state: values.state,
                        city: values.city,
                        neighborhood: values.neighborhood,
                        address: values.address,
                        number: values.number
                    },

                    photo: photoUrl,
                    status: "active",
                    isFirstAccess: false // User set their own password
                }

                await createStaff(staffData, {
                    ctxOverride: { idTenant: ids.idTenant, idBranch: ids.idBranch }
                })

                toast.show({ title: "Cadastro realizado com sucesso!", description: "Redirecionando para o login...", color: "success" })
                setTimeout(() => {
                    navigate(`/${tenantSlug}/${branchSlug}/login`)
                }, 3000)

            } catch (err) {
                console.error("Erro no cadastro:", err)
                toast.show({
                    title: "Erro ao realizar cadastro",
                    description: err.message || "Tente novamente.",
                    color: "danger"
                })
            } finally {
                setLoading(false)
            }
        }
    })

    // Address Lookup
    const handleCepBlur = async (e) => {
        const cep = e.target.value.replace(/\D/g, "")
        if (cep.length === 8) {
            const addr = await fetchAddressByCep(cep)
            if (addr) {
                validation.setFieldValue("state", addr.state)
                validation.setFieldValue("city", addr.city)
                validation.setFieldValue("neighborhood", addr.neighborhood)
                validation.setFieldValue("address", addr.address)
            }
        }
        validation.handleBlur(e)
    }

    // Photo Handling
    const handlePhotoClick = () => {
        fileInputRef.current.click()
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    if (loadingIds) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner color="primary" />
            </div>
        )
    }

    return (
        <div
            className="account-pages my-5 pt-sm-5 position-relative"
            style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '100vh',
                overflowX: 'hidden'
            }}
        >
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={6} xl={5}>
                        <Card className="overflow-hidden">
                            <div className="bg-primary">
                                <Row className="align-items-center">
                                    <Col xs={4} className="text-center ps-4">
                                        <img
                                            src={logoSwim}
                                            alt="Logo"
                                            className="img-fluid"
                                            style={{
                                                filter: 'brightness(0) invert(1)',
                                                maxHeight: '100px'
                                            }}
                                        />
                                    </Col>
                                    <Col xs={8}>
                                        <div className="text-white p-3">
                                            <h4 className="text-white font-size-12">Bem-vindo(a)!</h4>
                                            <p className="text-white-50 mb-0">Cadastre-se para acessar o Painel.</p>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                            <CardBody className="pt-0">
                                <div className="p-2">
                                    <Form className="form-horizontal" onSubmit={(e) => {
                                        e.preventDefault()
                                        validation.handleSubmit()
                                        return false
                                    }}>

                                        {/* Photo Section */}
                                        <div className="d-flex flex-column align-items-center mb-4 mt-4">
                                            <div
                                                onClick={handlePhotoClick}
                                                className="rounded-circle d-flex align-items-center justify-content-center bg-light cursor-pointer border position-relative"
                                                style={{ width: 100, height: 100, overflow: 'hidden', cursor: 'pointer' }}
                                            >
                                                {preview ? (
                                                    <img src={preview} alt="Preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <i className="mdi mdi-camera fs-2 text-muted"></i>
                                                )}
                                            </div>
                                            <Button color="link" size="sm" onClick={handlePhotoClick}>
                                                {preview ? "Alterar Foto" : "Adicionar Foto"}
                                            </Button>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                ref={fileInputRef}
                                                onChange={handlePhotoChange}
                                                style={{ display: 'none' }}
                                            />
                                        </div>

                                        <h5 className="font-size-14 mb-3">Dados Pessoais</h5>

                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>Nome</Label>
                                                    <Input
                                                        name="firstName"
                                                        placeholder="Nome"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.firstName}
                                                        invalid={!!(validation.touched.firstName && validation.errors.firstName)}
                                                    />
                                                    {validation.touched.firstName && validation.errors.firstName && <FormFeedback>{validation.errors.firstName}</FormFeedback>}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>Sobrenome</Label>
                                                    <Input
                                                        name="lastName"
                                                        placeholder="Sobrenome"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.lastName}
                                                        invalid={!!(validation.touched.lastName && validation.errors.lastName)}
                                                    />
                                                    {validation.touched.lastName && validation.errors.lastName && <FormFeedback>{validation.errors.lastName}</FormFeedback>}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>Data de Nascimento</Label>
                                                    <Input
                                                        name="birthDate"
                                                        type="date"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.birthDate}
                                                        invalid={!!(validation.touched.birthDate && validation.errors.birthDate)}
                                                    />
                                                    {validation.touched.birthDate && validation.errors.birthDate && <FormFeedback>{validation.errors.birthDate}</FormFeedback>}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>Sexo</Label>
                                                    <Input
                                                        type="select"
                                                        name="gender"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.gender}
                                                    >
                                                        <option value="Masculino">Masculino</option>
                                                        <option value="Feminino">Feminino</option>
                                                        <option value="Outro">Outro</option>
                                                    </Input>
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="mb-3">
                                            <Label>Telefone</Label>
                                            <InputMask
                                                mask="(99) 99999-9999"
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                value={validation.values.phone}
                                            >
                                                {(inputProps) => (
                                                    <Input
                                                        {...inputProps}
                                                        name="phone"
                                                        placeholder="(00) 00000-0000"
                                                        invalid={!!(validation.touched.phone && validation.errors.phone)}
                                                    />
                                                )}
                                            </InputMask>
                                            {validation.touched.phone && validation.errors.phone && <FormFeedback>{validation.errors.phone}</FormFeedback>}
                                        </div>

                                        <div className="mb-3">
                                            <Label>E-mail</Label>
                                            <Input
                                                name="email"
                                                type="email"
                                                placeholder="seu@email.com"
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                value={validation.values.email}
                                                invalid={!!(validation.touched.email && validation.errors.email)}
                                            />
                                            {validation.touched.email && validation.errors.email && <FormFeedback>{validation.errors.email}</FormFeedback>}
                                        </div>

                                        <h5 className="font-size-14 mb-3 mt-4">Endereço</h5>

                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>CEP</Label>
                                                    <InputMask
                                                        mask="99999-999"
                                                        onChange={validation.handleChange}
                                                        onBlur={handleCepBlur}
                                                        value={validation.values.cep}
                                                    >
                                                        {(inputProps) => (
                                                            <Input
                                                                {...inputProps}
                                                                name="cep"
                                                                placeholder="00000-000"
                                                                invalid={!!(validation.touched.cep && validation.errors.cep)}
                                                            />
                                                        )}
                                                    </InputMask>
                                                    {validation.touched.cep && validation.errors.cep && <FormFeedback>{validation.errors.cep}</FormFeedback>}
                                                </div>
                                            </Col>
                                            <Col md={8}>
                                                <div className="mb-3">
                                                    <Label>Cidade</Label>
                                                    <Input
                                                        name="city"
                                                        placeholder="Cidade"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.city}
                                                        invalid={!!(validation.touched.city && validation.errors.city)}
                                                    />
                                                    {validation.touched.city && validation.errors.city && <FormFeedback>{validation.errors.city}</FormFeedback>}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Estado</Label>
                                                    <Input
                                                        name="state"
                                                        placeholder="UF"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.state}
                                                        invalid={!!(validation.touched.state && validation.errors.state)}
                                                    />
                                                    {validation.touched.state && validation.errors.state && <FormFeedback>{validation.errors.state}</FormFeedback>}
                                                </div>
                                            </Col>
                                            <Col md={8}>
                                                <div className="mb-3">
                                                    <Label>Bairro</Label>
                                                    <Input
                                                        name="neighborhood"
                                                        placeholder="Bairro"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.neighborhood}
                                                        invalid={!!(validation.touched.neighborhood && validation.errors.neighborhood)}
                                                    />
                                                    {validation.touched.neighborhood && validation.errors.neighborhood && <FormFeedback>{validation.errors.neighborhood}</FormFeedback>}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={8}>
                                                <div className="mb-3">
                                                    <Label>Endereço</Label>
                                                    <Input
                                                        name="address"
                                                        placeholder="Rua, Av..."
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.address}
                                                        invalid={!!(validation.touched.address && validation.errors.address)}
                                                    />
                                                    {validation.touched.address && validation.errors.address && <FormFeedback>{validation.errors.address}</FormFeedback>}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Número</Label>
                                                    <Input
                                                        name="number"
                                                        placeholder="Nº"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.number}
                                                        invalid={!!(validation.touched.number && validation.errors.number)}
                                                    />
                                                    {validation.touched.number && validation.errors.number && <FormFeedback>{validation.errors.number}</FormFeedback>}
                                                </div>
                                            </Col>
                                        </Row>

                                        <h5 className="font-size-14 mb-3 mt-4">Segurança</h5>

                                        <div className="mb-3">
                                            <Label>Senha</Label>
                                            <Input
                                                name="password"
                                                type="password"
                                                placeholder="Mínimo 6 caracteres"
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                value={validation.values.password}
                                                invalid={!!(validation.touched.password && validation.errors.password)}
                                            />
                                            {validation.touched.password && validation.errors.password && <FormFeedback>{validation.errors.password}</FormFeedback>}
                                        </div>

                                        <div className="mb-3">
                                            <Label>Repita a senha</Label>
                                            <Input
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="Confirme a senha"
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                value={validation.values.confirmPassword}
                                                invalid={!!(validation.touched.confirmPassword && validation.errors.confirmPassword)}
                                            />
                                            {validation.touched.confirmPassword && validation.errors.confirmPassword && <FormFeedback>{validation.errors.confirmPassword}</FormFeedback>}
                                        </div>

                                        <div className="mt-4 d-grid">
                                            <ButtonLoader
                                                color="primary"
                                                type="submit"
                                                className="waves-effect waves-light"
                                                loading={loading || uploadingPhoto}
                                            >
                                                Cadastrar
                                            </ButtonLoader>
                                        </div>

                                    </Form>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default StaffSelfRegister
