// The icons a release-note item can use. The NAME is what's stored and what
// the mobile app renders (VectorIcons family="Feather"); the component is the
// same Feather glyph from react-icons, for the picker and the preview.
// Only names that exist in both sets belong here.
import {
  FiAlertTriangle, FiAward, FiBarChart2, FiBatteryCharging, FiBell, FiCalendar,
  FiCamera, FiCheck, FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiDownload,
  FiEdit3, FiFlag, FiGift, FiGlobe, FiHeadphones, FiHeart, FiImage, FiInfo, FiLayers,
  FiList, FiLock, FiMail, FiMapPin, FiMessageCircle, FiMic, FiMoon, FiMusic, FiPlayCircle,
  FiRadio, FiRefreshCw, FiSettings, FiShield, FiSliders, FiSmartphone, FiStar, FiSun,
  FiTarget, FiTool, FiTrendingUp, FiUser, FiUsers, FiVolume2, FiWifiOff, FiZap,
} from "react-icons/fi";

export const FEATHER_ICONS = {
  "zap": FiZap, "star": FiStar, "gift": FiGift, "check": FiCheck, "check-circle": FiCheckCircle,
  "music": FiMusic, "volume-2": FiVolume2, "headphones": FiHeadphones, "mic": FiMic, "radio": FiRadio,
  "play-circle": FiPlayCircle, "bell": FiBell, "calendar": FiCalendar, "clock": FiClock,
  "users": FiUsers, "user": FiUser, "award": FiAward, "flag": FiFlag, "target": FiTarget,
  "trending-up": FiTrendingUp, "bar-chart-2": FiBarChart2, "shield": FiShield, "lock": FiLock,
  "alert-triangle": FiAlertTriangle, "info": FiInfo, "tool": FiTool, "settings": FiSettings,
  "sliders": FiSliders, "refresh-cw": FiRefreshCw, "wifi-off": FiWifiOff, "download": FiDownload,
  "smartphone": FiSmartphone, "battery-charging": FiBatteryCharging, "message-circle": FiMessageCircle,
  "mail": FiMail, "map-pin": FiMapPin, "image": FiImage, "camera": FiCamera, "heart": FiHeart,
  "dollar-sign": FiDollarSign, "credit-card": FiCreditCard, "globe": FiGlobe, "layers": FiLayers,
  "list": FiList, "edit-3": FiEdit3, "sun": FiSun, "moon": FiMoon,
};

export const FeatherIcon = ({ name, size = 18, ...rest }) => {
  const Icon = FEATHER_ICONS[name] || FiCheck;
  return <Icon size={size} {...rest} />;
};
