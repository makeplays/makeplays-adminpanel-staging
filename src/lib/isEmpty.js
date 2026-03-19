export const isEmpty = (value) =>
value === undefined ||
value === null ||
typeof value === "object" && Object.keys(value).length === 0 ||
typeof value === "string" && value.trim().length === 0;

export const ObjectIsempty = (Obj) => {
  try {
    let objectArr = Object.values(Obj);
    for (let i = 0; i < objectArr.length; i++) {
      let emptyKey = [];
      if (!isEmpty(objectArr[i])) {

        return false;
      } else {
        emptyKey.push(i);
        if (emptyKey.length - 1 == objectArr.length - 1) {

          return true;
        }
      }
    }
    return true;
  } catch (err) {
    console.log("ObjectIsempty_err", err);
  }
};