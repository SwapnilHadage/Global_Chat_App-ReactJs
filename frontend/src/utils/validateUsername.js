const USERNAME_REGEX =
/^(?=.{3,20}$)[A-Za-z0-9](?:[A-Za-z0-9]|[._-](?=[A-Za-z0-9]))*$/;

const reserved = new Set([
        "admin",
        "administrator",
        "system",
        "server",
        "owner",
        "moderator",
    ]);


export function validateUsername(username){
  if(!username || !username.trim() || !username.trim().length){
    return {
      valid: false,
      message: 'Please Enter Username!',
    };
  }
  username = username.trim();
  if(!USERNAME_REGEX.test(username)){
    return {
      valid: false,
      message:
        "Username must be 3–20 characters, start with a letter or number, and use only letters, numbers, ., _, or -. Special characters can't be consecutive or appear at the end.",
      };
  }
  if(reserved.has(username.toLowerCase())){
    return {
      valid: false,
      message: "Try Different Username.",
    };
  }

  return{
    valid:true,
    username,
  }
}