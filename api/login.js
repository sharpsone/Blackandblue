import cookie from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  const year = new Date().getFullYear();

  const url = `https://www.myfantasyleague.com/${year}/login`;

  const body = new URLSearchParams({
    USERNAME: username,
    PASSWORD: password
  });

  const response = await fetch(url, {
    method: "POST",
    redirect: "manual", // important: do NOT auto-follow
    headers: {
      "User-Agent": "BlackAndBlueApp",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "*/*",
      "Connection": "keep-alive"
    },
    body
  });

  // Extract cookies from response headers
  const setCookie = response.headers.get("set-cookie");
  console.log("SET-COOKIE:", setCookie);

  if (!setCookie) {
    return res.status(401).json({ error: "Login failed — no cookies returned" });
  }

  // Split multiple cookies
  const cookieParts = setCookie.split(",").map(c => c.trim());

  const cookiesToSet = cookieParts.map(c =>
    c.split(";")[0] // only the key=value part
  );

  // Set cookies in browser
  res.setHeader(
    "Set-Cookie",
    cookiesToSet.map(c =>
      cookie.serialize(c.split("=")[0], c.split("=")[1], {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        path: "/"
      })
    )
  );

  return res.status(200).json({ ok: true });
}
