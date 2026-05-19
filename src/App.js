import "./App.css";
import "../src/assets/css/Style.css";
import isEmpty from "is-empty";
import jwt_decode from "jwt-decode";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import ConditionRoute from "./Components/ConditionRoute";
import NotFound from "./Components/NotFound";
import { useDispatch, useSelector } from "react-redux";
import HelperRoute from "./HelperRoutes.js";
import SocketContext from "./context/socketContext.js";
import { JoinRoom, socket } from "./config/socketIO.js";

// Public Screens
import LoginPage from "./Screens/LoginPage";
import ForgotPassword from "./Screens/ForgotPassword";
import ResetNewPassword from "./Screens/ResetNewPassword";
import OTPVerification from "./Screens/OTPVerification";
import { getAuthToken } from "./lib/localStorage";
import { SET_AUTHENTICATION } from "./constant";

// Private Screens
import AllTeamPage from "./Screens/AllTeamPage/AllTeamPage";
import UsersPage from "./Screens/UsersPage";
import EventsPage from "./Screens/EventsPage/EventsPage";
import EmailTemplatePage from "./Screens/EmailTemplatePage/EmailTemplatePage";
import MembersPage from "./Screens/MembersPage/MembersPage";
import SportPage from "./Screens/SportPage/SportPage";
import { Toaster } from "sonner";
import { EditTeamPage } from "./Screens/AllTeamPage/EditTeamPage";
import { EditMembersPage } from "./Screens/MembersPage/EditMembersPage";
import { EditEventsPage } from "./Screens/EventsPage/EditEventsPage";
import { EditEmailTemplatePage } from "./Screens/EmailTemplatePage/EditEmailTemplatePage";
import { EditSportPage } from "./Screens/SportPage/EditSportPage";
import { AddSportPage } from "./Screens/SportPage/AddSportPage";
import { AddEventsPage } from "./Screens/EventsPage/AddEventsPage";
import ProfilePage from "./Screens/ProfilePage";
import VoicePage from "./Screens/VoicesPage/VoicesPage";
import LanguagePage from "./Screens/LanguagePage/LanguagePage";
import { EditPlaylistPage } from "./Screens/PlaylistPage/EditPlaylistPage";
import PlaylistPage from "./Screens/PlaylistPage/PlaylistPage";
import AttendancePage from "./Screens/AttendancePage/AttendancePage";
import UsersAndAccessPage from "./Screens/UsersAndAccessPage/UsersAndAccessPage";
import { AddUsersPage } from "./Screens/UsersAndAccessPage/AddUsersPage";
import { EditUsersPage } from "./Screens/UsersAndAccessPage/EditUsersPage";
import { components } from "react-select";
import VoiceTemplatePage from "./Screens/VoiceTemplatePage/VoiceTemplatePage.jsx";
import { AddVoiceTemplatePage } from "./Screens/VoiceTemplatePage/AddVoiceTemplatePage.jsx";
import { EditVoiceTemplatePage } from "./Screens/VoiceTemplatePage/EditVoiceTemplatePage.jsx";
import { CreditsPage } from "./Screens/CreditsPage/CreditsPage.jsx";
import ContactUsPage from "./Screens/ContactUsPage/ContactUsPage.jsx";
import Dashboard from "./Screens/Dashboard/Dashboard.jsx";
import CmsPage from "./Screens/CmsPage/CmsPage.jsx";
import { EditCmsPage } from "./Screens/CmsPage/EditCmsPage.jsx";
import BroadcastPage from "./Screens/BroadcastPage/BroadcastPage.jsx";
import { AddBroadcastpage } from "./Screens/BroadcastPage/AddBroadcastPage.jsx";
import { ReplyContactUsPage } from "./Screens/ContactUsPage/ReplyContactUsPage.js";
import FaqPage from "./Screens/FaqPage/FaqPage.jsx";
import { AddFaqPage } from "./Screens/FaqPage/AddFaqPage.jsx";
import { EditFaqPage } from "./Screens/FaqPage/EditFaqPage.jsx";
import DataDeletion from "./Screens/DataDeletion/DataDeletion.jsx";
import AnnouncementTemplatePage from "./Screens/AnnouncementTemplatePage/AnnouncementTemplatePage.jsx";
import { AddAnnouncementTemplatePage } from "./Screens/AnnouncementTemplatePage/AddAnnouncementTemplatePage.jsx";
import { EditAnnouncementTemplatePage } from "./Screens/AnnouncementTemplatePage/EditAnnouncementTemplatePage.jsx";

function App() {
  const dispatch = useDispatch();

  const routes = [
    // makeplays routers
    // public
    { path: "/", component: LoginPage, type: "auth" },
    { path: "/forgot-password", component: ForgotPassword, type: "auth" },
    { path: "/resetpassword", component: ResetNewPassword, type: "private" },
    // { path: "/otpVerification", component: OTPVerification, type: "auth" },

    // Private
    { path: "/teams", component: AllTeamPage, type: "private" },
    { path: "/teams/edit", component: EditTeamPage, type: "private" },
    { path: "/users", component: UsersPage, type: "private" },
    { path: "/events", component: EventsPage, type: "private" },
    { path: "/events/edit", component: EditEventsPage, type: "private" },
    { path: "/events/add", component: AddEventsPage, type: "private" },
    { path: "/members", component: MembersPage, type: "private" },
    { path: "/members/edit", component: EditMembersPage, type: "private" },
    { path: "/email-template", component: EmailTemplatePage, type: "private" },
    {
      path: "/email-template/edit",
      component: EditEmailTemplatePage,
      type: "private",
    },
    { path: "/sports", component: SportPage, type: "private" },
    { path: "/sports/edit", component: EditSportPage, type: "private" },
    { path: "/sports/add", component: AddSportPage, type: "private" },
    { path: "/attendance", component: AttendancePage, type: "private" },
    { path: "/profile", component: ProfilePage, type: "private" },
    { path: "/playlist", component: PlaylistPage, type: "private" },
    { path: "/playlist/edit", component: EditPlaylistPage, type: "private" },
    { path: "/voice", component: VoicePage, type: "private" },
    { path: "/language", component: LanguagePage, type: "private" },
    {
      path: "/admin-and-access",
      component: UsersAndAccessPage,
      type: "private",
    },
    { path: "/admin-and-access/add", component: AddUsersPage, type: "private" },
    {
      path: "/admin-and-access/edit",
      component: EditUsersPage,
      type: "private",
    },
    { path: "/voice-template", component: VoiceTemplatePage, type: "private" },
    {
      path: "/voice-template/add",
      component: AddVoiceTemplatePage,
      type: "private",
    },
    {
      path: "/voice-template/edit",
      component: EditVoiceTemplatePage,
      type: "private",
    },
    { path: "/credits", component: CreditsPage, type: "private" },
    { path: "/contactus", component: ContactUsPage, type: "private" },
    {
      path: "/contactus/reply",
      component: ReplyContactUsPage,
      type: "private",
    },
    { path: "/dashboard", component: Dashboard, type: "private" },
    { path: "/cms", component: CmsPage, type: "private" },
    { path: "/cms/edit", component: EditCmsPage, type: "private" },
    { path: "/broadcast", component: BroadcastPage, type: "private" },
    { path: "/broadcast/add", component: AddBroadcastpage, type: "private" },
    { path: "/faq", component: FaqPage, type: "private" },
    { path: "/faq/add", component: AddFaqPage, type: "private" },
    { path: "/faq/edit", component: EditFaqPage, type: "private" },
    { path: "/data-deletion", component: DataDeletion, type: "public" },
    { path: "/announcement-template", component: AnnouncementTemplatePage, type: "private" },
    { path: "/announcement-template/add", component: AddAnnouncementTemplatePage, type: "private" },
    { path: "/announcement-template/edit", component: EditAnnouncementTemplatePage, type: "private" },  
  ];

  useEffect(() => {
    let token = getAuthToken();
    if (!isEmpty(token)) {
      token = token.replace("Bearer ", "");
      const decoded = jwt_decode(token);
      if (decoded) {
        JoinRoom(decoded?._id?.toString());
        dispatch({
          type: SET_AUTHENTICATION,
          authData: {
            isAuth: true,
            isLoading: false,
            userId: decoded._id,
            restrictions: decoded.restrictions,
            accessLevel: decoded.accessLevel,
            role: decoded.role,
            email: decoded.email,
            name: decoded.name,
          },
        });
      }
    } else {
      dispatch({
        type: SET_AUTHENTICATION,
        authData: {
          isAuth: false,
          isLoading: false,
          userId: "",
          restrictions: "",
          role: "",
          accessLevel: "",
          email: "",
          name: "",
        },
      });
    }
  }, [dispatch]);

  if (process.env.REACT_APP_MODE == "production") {
    console.log = () => {};
    console.info = () => {};
    console.error = () => {};
    console.info = () => {};
  }

  return (
    <BrowserRouter>
      <SocketContext.Provider value={{ socket }}>
        <HelperRoute>
          <Toaster
            position="top-right"
            theme="light"
            richColors
            className="customToaster"
          />
          <Switch>
            {routes.map(({ path, component, type }, index) => (
              <ConditionRoute
                key={index}
                exact
                path={path}
                component={component}
                type={type || "private"}
              />
            ))}
            <ConditionRoute component={NotFound} />
          </Switch>
        </HelperRoute>
      </SocketContext.Provider>
    </BrowserRouter>
  );
}

export default App;


