const jwt = require("jsonwebtoken");
const { customAlphabet } = require("nanoid");

const tokenSuffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

const getJitsiDomain = () => process.env.JITSI_DOMAIN || "meet.jit.si";

const buildRoomName = (appointmentId) => {
  const normalized = String(appointmentId || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return `carenet-${normalized}-${tokenSuffix()}`;
};

const buildRoomUrl = (roomName) => `https://${getJitsiDomain()}/${roomName}`;

const buildParticipantConfig = ({ role, name, email }) => ({
  displayName: name || "CareNet User",
  userInfo: {
    displayName: name || "CareNet User",
    email: email || "",
  },
  configOverwrite: {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    prejoinPageEnabled: true,
  },
  interfaceConfigOverwrite: {
    MOBILE_APP_PROMO: false,
  },
  // For Jitsi moderation flows, doctor/admin becomes moderator.
  userRole: role === "doctor" || role === "admin" ? "moderator" : "participant",
});

const signJitsiJwt = ({ roomName, userId, role, name, email }) => {
  const appId = process.env.JITSI_APP_ID;
  const appSecret = process.env.JITSI_APP_SECRET;

  if (!appId || !appSecret) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: "jitsi",
    iss: appId,
    sub: getJitsiDomain(),
    room: roomName,
    exp: now + 60 * 60,
    nbf: now - 10,
    context: {
      user: {
        id: String(userId || ""),
        name: name || "CareNet User",
        email: email || "",
        moderator: role === "doctor" || role === "admin",
      },
    },
  };

  return jwt.sign(payload, appSecret, { algorithm: "HS256" });
};

module.exports = {
  buildRoomName,
  buildRoomUrl,
  buildParticipantConfig,
  signJitsiJwt,
};
