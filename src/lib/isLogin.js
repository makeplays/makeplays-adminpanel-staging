const isLogin = () => {
    if (localStorage.getItem('token')) {
        console.log('isLogin', localStorage.getItem('token'))
        return true;
    }
    return false;
}
export default isLogin;