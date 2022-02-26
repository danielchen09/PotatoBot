import { useState } from 'react';
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
import {get_params} from "../utils";

function onInputChange(e, setInput, setSearchResult) {
    if (e.key === 'Enter') {
        search(e.currentTarget.value, setSearchResult);
    }
    setInput(e.currentTarget.value);
}

function search(query, setSearchResults) {
    // console.log(query);
    fetch('https://www.googleapis.com/youtube/v3/search?' + get_params({
        q: query,
        part: 'snippet',
        key: process.env.REACT_APP_GOOGLE_API_KEY
    })).then(async r => {
        let response = await r.json()
        let res = response.items?.map(item => {
            return {
                id: item.id.videoId,
                author: item.snippet.channelTitle,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.default.url
            }
        });
        setSearchResults(res);
    });
}


export default function SearchBar({setSearchResult}) {
    const [input, setInput] = useState('');
    return (
        <Flex justify="center">
            <Input placeholder='Search' size='lg' bg="#F2CC8F" onKeyDown={e => onInputChange(e, setInput, setSearchResult)}/>
            <IconButton aria-label='fuck blind people' icon={<MdSearch />} onClick={() => search(input, setSearchResult)} />
        </Flex>
    );
}
