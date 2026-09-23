function cookieOptions() {
  const production = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || "lax";
  return { httpOnly:true, secure:production, sameSite, maxAge:1000*60*60*24*7, path:"/" };
}
module.exports={cookieOptions};
