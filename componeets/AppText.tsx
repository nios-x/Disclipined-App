import { Text as RNText, TextProps } from "react-native";
import { Fonts } from "@/constants/fonts";

export default function AppText(props: TextProps) {
  return (
    <RNText
      {...props}
      style={[
        { fontFamily: Fonts.regular, color: "#111" },
        props.style,
      ]}
    />
  );
}