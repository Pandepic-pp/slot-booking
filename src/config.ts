export interface User {
    username: string;
    password: string;
    role: string;
}

export interface Center {
    id: number
    name: string;
    address: string | null;
    lanes: number;
}

export interface Packages {
    id: number;
    package: number;
    validity: number;
    price: number;
}

export const user: User = {
    username: 'stbadmin',
    password: 'abcd@1234',
    role: 'admin'
};

export const centers: Center[] = [
    {
        id: 1,
        name: 'Strike the ball - Sector 110',
        address: 'K Block, N 1-55, Rajendra Park Rd, opp. Ahuja Garden, near Sarai Chowk, K Block, New Palam Vihar Phase 1, Sector 110, Gurugram, Haryana 122017',
        lanes: 2
    },
    {
        id: 2,
        name: 'Strike the ball - Sector 93',
        address: 'Shop No. 5, First Floor, Sector 93 Rd, opposite Shiv Mandir, Hayatpur, Sector 93, Gurugram, Haryana 122505',
        lanes: 2
    },
    {
        id: 3,
        name: 'Strike the ball - Sector 10A',
        address: "Basement of, Dr Chandna's Dental and Implant Centre, House No - 67 Main Hudda Market, opposite Om Sweets, Sector 10A, Gurugram, Haryana 122001",
        lanes: 3
    },
    {
        id: 4,
        name: 'Strike the ball - Sector 107',
        address: 'Strike The Box, near Six Flag 2.0, Sector 107, Gurugram, Haryana 122017',
        lanes: 2
    },
]

export const packages: Packages[] = [
    {
        id: 1,
        package: 150,
        validity: 1,
        price: 4000
    },
    {
        id: 2,
        package: 300,
        validity: 3,
        price: 6000
    },
    {
        id: 3,
        package: 1000,
        validity: 6,
        price: 10000
    },
    {
        id: 4,
        package: 700,
        validity: 12,
        price: 11000
    },
    {
        id: 5,
        package: Number.POSITIVE_INFINITY,
        validity: 3,
        price: 20000
    },
    {
        id: 6,
        package: Number.POSITIVE_INFINITY,
        validity: 0.03,
        price: 2000
    }
]