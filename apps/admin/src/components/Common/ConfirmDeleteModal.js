import React from "react"
import PropTypes from "prop-types"
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap"

const ConfirmDeleteModal = ({
  isOpen,
  title,
  message,
  confirmText = "Excluir",
  cancelText = "Cancelar",
  confirmColor = "danger",
  loadingText = "Excluindo...",
  onConfirm,
  onCancel,
  loading = false,
}) => (
  <Modal isOpen={isOpen} toggle={onCancel} centered>
    <ModalHeader toggle={onCancel}>{title}</ModalHeader>
    <ModalBody>
      {typeof message === "string" ? <p className="mb-0">{message}</p> : message}
    </ModalBody>
    <ModalFooter>
      <Button color="secondary" onClick={onCancel} disabled={loading}>
        {cancelText}
      </Button>
      <Button color={confirmColor} onClick={onConfirm} disabled={loading}>
        {loading ? loadingText : confirmText}
      </Button>
    </ModalFooter>
  </Modal>
)

ConfirmDeleteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.node,
  message: PropTypes.node,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmColor: PropTypes.string,
  loadingText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

export default ConfirmDeleteModal
