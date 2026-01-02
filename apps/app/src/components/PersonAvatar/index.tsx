import { FC } from "react";

// @mui material components
import Avatar from "@mui/material/Avatar";
import { styled, Theme } from "@mui/material/styles";
import Icon from "@mui/material/Icon";

// Declaring props types
interface Props {
  src?: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  shadow?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "inset";
  [key: string]: any;
}

const StyledAvatar = styled(Avatar)(
  ({ theme, ownerState }: { theme?: Theme | any; ownerState: any }) => {
    const { functions, typography, boxShadows } = theme;
    const { pxToRem } = functions;
    const { size: fontSize } = typography;
    const { size, shadow } = ownerState;

    // size value
    let sizeValue;

    switch (size) {
      case "xs":
        sizeValue = {
          width: pxToRem(24),
          height: pxToRem(24),
          fontSize: fontSize.xs,
        };
        break;
      case "sm":
        sizeValue = {
          width: pxToRem(36),
          height: pxToRem(36),
          fontSize: fontSize.sm,
        };
        break;
      case "lg":
        sizeValue = {
          width: pxToRem(58),
          height: pxToRem(58),
          fontSize: fontSize.sm,
        };
        break;
      case "xl":
        sizeValue = {
          width: pxToRem(74),
          height: pxToRem(74),
          fontSize: fontSize.md,
        };
        break;
      case "xxl":
        sizeValue = {
          width: pxToRem(110),
          height: pxToRem(110),
          fontSize: fontSize.md,
        };
        break;
      default: {
        sizeValue = {
          width: pxToRem(48),
          height: pxToRem(48),
          fontSize: fontSize.md,
        };
      }
    }

    return {
      backgroundColor: "#9e9e9e", // Gray background
      color: "#ffffff", // White icon
      boxShadow: boxShadows[shadow] || "none",
      ...sizeValue,
    };
  }
);

const PersonAvatar: FC<Props> = ({ src, alt, size = "md", shadow = "none", ...rest }) => {
  if (src && src.trim() !== "") {
    // If there's a valid image source, use it
    return <StyledAvatar src={src} alt={alt} ownerState={{ size, shadow }} {...rest} />;
  }

  // If no image, show person icon
  return (
    <StyledAvatar ownerState={{ size, shadow }} {...rest}>
      <Icon
        sx={{
          fontSize:
            size === "xs"
              ? "1.2rem"
              : size === "sm"
              ? "1.5rem"
              : size === "md"
              ? "1.8rem"
              : size === "lg"
              ? "2rem"
              : "2.2rem",
        }}
      >
        person
      </Icon>
    </StyledAvatar>
  );
};

export default PersonAvatar;
