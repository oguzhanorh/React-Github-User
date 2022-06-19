import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

//Provider,Consumer - GithubContext.Provider

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser); //user için kullanacağım api
  const [repos, setRepo] = useState(mockRepos); // repository için kullanacağım api

  const [followers, setFollowers] = useState(mockFollowers); //takipcilerim için kullanacağım api
  //request loading
  const [requests, setRequests] = useState(0);
  const [isloading, setIsLoading] = useState(false);
  //error
  const [error, setError] = useState({ show: false, msg: '' });

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;

      //repos most popular language
      //  await axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((response) =>
      //     setRepo(response.data)
      //   );
      //   //followers most used language
      // await  axios(`${followers_url}?per_page=100`).then((response) =>
      //     setFollowers(response.data)
      //   );
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),

        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        const [repos, followers] = results;
        const status = 'fulfilled';
        if (repos.status === status) {
          setRepo(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, 'there is no user with that username');
    }
    checkRequest();
    setIsLoading(false);
  };

  //check rate
  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaing },
        } = data;

        setRequests(remaing);
        if (remaing === 0) {
          toggleError(true, 'sorry, you have exceeded your hourly rate limit!');
        }
      })
      .catch((err) => console.log(err));
  };

  function toggleError(show = false, msg = '') {
    setError({ show, msg });
  }

  //error
  useEffect(checkRequest, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isloading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};
export { GithubProvider, GithubContext };
