"use server";

import { prisma, getOrgId } from "./db";
import { sendToOwnerDevices } from "./push";
import { audit } from "./audit";

// Register this phone/browser for owner notifications, then prove it works
// with an immediate test ping.
export async function savePushSub(sub: { endpoint: string; keys: { p256dh: string; auth: string } }, label?: string) {
  const orgId = await getOrgId();
  await prisma.pushSub.upsert({
    where: { endpoint: sub.endpoint },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, label },
    create: { orgId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, role: "owner", label },
  });
  await audit("push.subscribe", { detail: { label } });
  const r = await sendToOwnerDevices({
    title: "Notifications are on 🤝",
    body: "Morning brief around 7:30am, evening check-in around 6pm — only when there's something worth saying.",
    url: "/",
    tag: "unc-welcome",
  });
  return { ok: true, ...r };
}

export async function removePushSub(endpoint: string) {
  await prisma.pushSub.deleteMany({ where: { endpoint } });
  await audit("push.unsubscribe", {});
  return { ok: true };
}
