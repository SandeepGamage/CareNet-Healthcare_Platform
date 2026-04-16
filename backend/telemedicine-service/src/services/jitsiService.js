const jwt = require("jsonwebtoken");
const fs = require("fs");
const { customAlphabet } = require("nanoid");

const tokenSuffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

const getJitsiDomain = () => process.env.JITSI_DOMAIN || "8x8.vc";
const normalizeMultilineKey = (value) => String(value || "").replace(/\\n/g, "\n");
const getPrivateKeyFromPath = () => {
  const keyPath = process.env.JAAS_PRIVATE_KEY_PATH;

  if (!keyPath) {
    return null;
  }

  try {
    return fs.readFileSync(keyPath, "utf8");
  } catch (error) {
    return null;
  }
};

const getJitsiPrivateKey = () =>
  normalizeMultilineKey(process.env.JITSI_PRIVATE_KEY || getPrivateKeyFromPath());

const buildJaasKeyId = (appId, keyId) => {
  const normalizedKeyId = String(keyId || "").trim();
  if (!normalizedKeyId) {
    return "";
  }

  return normalizedKeyId.includes("/") ? normalizedKeyId : `${appId}/${normalizedKeyId}`;
};

const buildRoomName = (appointmentId) => {
  const normalized = String(appointmentId || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return `carenet-${normalized}-${tokenSuffix()}`;
};

const buildRoomUrl = (roomName) => {
  const appId = process.env.JITSI_APP_ID;

  if (!appId) {
    return `https://${getJitsiDomain()}/${roomName}`;
  }

  return `https://${getJitsiDomain()}/${appId}/${roomName}`;
};

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
  const now = Math.floor(Date.now() / 1000);
  const appId = process.env.JITSI_APP_ID;
  const keyId = buildJaasKeyId(appId, process.env.JITSI_KEY_ID);
  const privateKey = getJitsiPrivateKey();

  if (!appId || !keyId || !privateKey) {
    return null;
  }

  const payload = {
    aud: "jitsi",
    iss: "chat",
    sub: appId,
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
      features: {
        livestreaming: false,
        recording: false,
        transcription: false,
        "outbound-call": false,
      },
    },
  };

  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    header: { kid: keyId, typ: "JWT" },
  });
};

module.exports = {
  buildRoomName,
  buildRoomUrl,
  buildParticipantConfig,
  getJitsiDomain,
  signJitsiJwt,
};
