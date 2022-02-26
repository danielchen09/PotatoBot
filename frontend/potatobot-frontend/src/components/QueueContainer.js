import React from 'react';
import {
    ChakraProvider,
    Box,
    Text,
    Link,
    Stack,
    Code,
    Grid,
    theme,
    Flex, Input, IconButton
} from '@chakra-ui/react';
import { MdSearch } from 'react-icons/md'
import SearchResult from "./SearchResult";
import QueueItem from "./QueueItem";

export default function QueueContainer({queue, setQueue}) {
    return (
        <Stack w="100%" h="100%">
            <Flex h="3%">
                Queue
            </Flex>
            <Stack w="100%" h="97%" bg="#F2CC8F" overflowY="auto" p="2">
                {queue.map((queueItem, index) => {
                    return <QueueItem id={index} title={queueItem.title} author={queueItem.author} queue={queue} setQueue={setQueue} />
                })}
            </Stack>
        </Stack>
    );
}
