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
    Flex, Input, IconButton, Image
} from '@chakra-ui/react';
import { MdSearch } from 'react-icons/md'
import {post_backend} from "../utils";

export default function SearchResult({id, videoId, thumbnail, title, author, queue, setQueue}) {
    return (
        <Flex key={id} h="100px" bg="#81B29A" p="2" align="center" onClick={() => {
            let newSong = {
                id: videoId,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                title: title,
                author: author,
                thumbnail: thumbnail
            };
            setQueue([...queue, newSong]);
            post_backend('addsong', {
                guildId: localStorage.getItem('guildId'),
                song: newSong
            });
        }} _hover={{
            background: "#A5C8B7",
            transition: "0.3s",
            cursor: "pointer"
        }}>
            <Image src={thumbnail} alt='Thumbnail' w="80px" h="80px" mr="10px"/>
            <Stack>
                <Text fontSize="md">
                    {title}
                </Text>
                <Text fontSize="sm">
                    {author}
                </Text>
            </Stack>
        </Flex>
    );
}
