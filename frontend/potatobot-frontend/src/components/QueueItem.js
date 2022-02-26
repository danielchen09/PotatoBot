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
    Flex, Input, IconButton, Image, Icon
} from '@chakra-ui/react';
import { MdRemoveCircle } from 'react-icons/md'
import {post_backend} from "../utils";

function removeItem(idx, queue, setQueue) {
    let newQueue = [...queue];
    console.log(queue, newQueue, idx);
    newQueue.splice(idx, 1);
    setQueue(newQueue);
    post_backend('removesong', {
        guildId: localStorage.getItem('guildId'),
        index: idx
    });
}

export default function QueueItem({id, title, author, queue, setQueue}) {
    return (
        <Flex key={id} h="100px" bg="#81B29A" p="3" align="center">
            <Stack w="80%">
                <Text fontSize="sm" isTruncated>
                    {title}
                </Text>
                <Text fontSize="xs">
                    {author}
                </Text>
            </Stack>
            <IconButton w="10%" icon={<MdRemoveCircle />} bg="#81B29A" onClick={() => removeItem(id, queue, setQueue)} _hover={{
                background: "#A5C8B7",
                transition: "0.3s",
                cursor: "pointer"
            }}  aria-label=""/>
        </Flex>
    );
}
