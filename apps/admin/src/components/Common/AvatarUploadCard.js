import React, { useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { Button, Spinner, UncontrolledTooltip } from "reactstrap";

const sizeMap = {
  xs: 64,
  sm: 96,
  md: 128,
  lg: 160,
  xl: 200,
  xxl: 240,
};

const borderRadiusMap = {
  circular: "50%",
  rounded: "0.75rem",
  square: "0",
};

const AvatarUploadCard = ({
  imageUrl,
  defaultImage,
  accept = "image/*",
  disabled,
  loading,
  mt = 2,
  size = "xxl",
  variant = "rounded",
  onSelectFile,
  buttonIcon = "mdi mdi-upload",
  tooltip = "Editar foto",
}) => {
  const ids = useMemo(() => {
    const unique = Math.random().toString(36).slice(2);
    return {
      input: `avatar-upload-input-${unique}`,
      button: `avatar-upload-btn-${unique}`,
    };
  }, []);
  const inputRef = useRef(null);

  const selectedSize = sizeMap[size] || sizeMap.xxl;
  const borderRadius = borderRadiusMap[variant] || borderRadiusMap.rounded;

  const handleTriggerInput = () => {
    if (disabled || loading) return;
    inputRef.current?.click();
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0] || null;
    onSelectFile?.(file);
    if (event.target) {
      event.target.value = "";
    }
  };

  const previewSrc = imageUrl || defaultImage;

  return (
    <div
      className="position-relative"
      style={{ marginTop: `${mt}rem`, width: selectedSize, height: selectedSize }}
    >
      <div
        className="overflow-hidden bg-light d-flex align-items-center justify-content-center"
        style={{ width: "100%", height: "100%", borderRadius }}
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span className="text-muted">Pré-visualização</span>
        )}
      </div>
      <input
        id={ids.input}
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <div className="position-absolute" style={{ right: -10, bottom: -10 }}>
        <UncontrolledTooltip placement="top" target={ids.button}>
          {tooltip}
        </UncontrolledTooltip>
        <Button
          id={ids.button}
          type="button"
          color="primary"
          size="sm"
          className="rounded-circle shadow"
          disabled={disabled || loading}
          onClick={handleTriggerInput}
        >
          {loading ? <Spinner size="sm" color="light" /> : <i className={buttonIcon} />}
        </Button>
      </div>
    </div>
  );
};

AvatarUploadCard.propTypes = {
  imageUrl: PropTypes.string,
  defaultImage: PropTypes.string,
  accept: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  mt: PropTypes.number,
  size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl", "xxl"]),
  variant: PropTypes.oneOf(["circular", "rounded", "square"]),
  onSelectFile: PropTypes.func.isRequired,
  buttonIcon: PropTypes.string,
  tooltip: PropTypes.string,
};

export default AvatarUploadCard;
