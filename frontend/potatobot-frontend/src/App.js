import {useContext, useEffect, useRef, useState} from 'react';
import {
    ChakraProvider,
    Box,
    Text,
    Link,
    Stack,
    Code,
    Grid,
    theme,
    Flex
} from '@chakra-ui/react';
import {ColorModeSwitcher} from './ColorModeSwitcher';
import {Logo} from './Logo';
import SearchBar from "./components/SearchBar";
import SearchResultContainer from "./components/SearchResultContainer";
import QueueContainer from "./components/QueueContainer";
import { BrowserRouter as Router, useSearchParams } from "react-router-dom";
import {get_backend} from "./utils";
import socketClient from "socket.io-client";


function updateQueue(setQueue) {
    get_backend('listqueue', {
        guildId: localStorage.getItem('guildId')
    }).then(res => {
        console.log(res.queue);
        setQueue(res.queue)
    });
}


function App(props) {
    const [searchResults, setSearchResults] = useState([]);
    const [queue, setQueue] = useState([]);
    const guildId = new URLSearchParams(window.location.search).get('guildId');
    localStorage.setItem('guildId', guildId);
    // updateQueue(setQueue);
    useEffect(() => {
        const socket = socketClient(process.env.REACT_APP_BACKEND_URI);
        socket.on('error', function (err) {
            console.log(err);
        });
        socket.on("queue:update", data => {
            console.log('update queue')
            updateQueue(setQueue);
        });
        socket.on('test', data => {
            console.log(data)
        });
        updateQueue(setQueue);
        socket.emit('join', guildId);
    }, []);

    return (
        <ChakraProvider theme={theme}>
            <Box h="100vh">
                <Stack>
                    <Flex w="100vw" h="10vh" bg="#F2CC8F" id="header" justify="center" align="center" fontSize="3xl">
                        Potato Bot
                    </Flex>
                    <Flex w="100vw" h="90vh" mt="0px !important" id="content">
                        <Flex w="15vw" bg="#3D405B" id="sidebar">

                        </Flex>
                        <Flex bg="#F4F1DE" w="85vw" id="main-content" p="10">
                            <Stack w="75%" justify="space-between">
                                <SearchBar setSearchResult={setSearchResults}/>
                                <SearchResultContainer searchResults={searchResults} queue={queue} setQueue={setQueue}/>
                            </Stack>
                            <Flex w="25%" justify="center" id="queue-container-container" px="10">
                                <QueueContainer queue={queue} setQueue={setQueue}/>
                            </Flex>
                        </Flex>
                    </Flex>
                </Stack>
            </Box>
        </ChakraProvider>
    );
}

export default App;
