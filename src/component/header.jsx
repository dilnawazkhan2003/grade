import {AppBar , Toolbar , styled , Typography} from "@mui/material"

const Navbar = styled (AppBar)({
    backgroundColor: "#fff",
    color: 'black',
})

const Header = () => {
  return (
    <Navbar>
    <Toolbar>
    <Typography>SSC CGL Tier 1 2023 Tier-I Official Paper</Typography>
    </Toolbar>
      
    </Navbar>
  )
}

export default Header;
