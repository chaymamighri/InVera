package org.erp.invera.controller;


import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/test")
public class AuthTestController {

    @GetMapping("/admin")
    public String admin() {
        return "Admin access OK";
    }

    @GetMapping("/achats")
    public String achats() {
        return "Achats access OK";
    }

    @GetMapping("/commercial")
    public String commercial() {
        return "Commercial access OK";
    }
}
