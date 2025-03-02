import * as Icons from "@expo/vector-icons";
import React, { memo } from "react";
import { TextProps } from "react-native";

export type IconType = keyof typeof Icons;

const DEFAULT_NAME = "add";
const DEFAULT_TYPE = "Ionicons";
const DEFAULT_SIZE = 25;

interface IconProps extends TextProps {
  name?: string;
  type?: IconType;
  size?: number;
  color?: string;
}

function IconCompo({
  name = DEFAULT_NAME,
  type = DEFAULT_TYPE,
  size = DEFAULT_SIZE,
  color,
  ...other
}: IconProps): React.JSX.Element {
  const Component = Icons[type];

  if (!Component) {
    console.warn(`Invalid icon type: ${type}`);
    return <></>;
  }

  return <Component {...other} name={name} size={size} color={color} />;
}
export default memo(IconCompo);
