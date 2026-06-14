package com.library.controller;

import com.library.dto.BorrowRequestDTO;
import com.library.service.BorrowService;
import com.library.utils.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

@RestController
@RequestMapping("/api/borrow")
public class BorrowController {

    @Autowired
    private BorrowService borrowService;

    @PostMapping
    public Result<?> borrow(HttpServletRequest request, @Valid @RequestBody BorrowRequestDTO dto) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            borrowService.borrowBook(userId, dto.getBookId());
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/return/{recordId}")
    public Result<?> returnBook(HttpServletRequest request, @PathVariable Long recordId) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            borrowService.returnBook(userId, recordId);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/my")
    public Result<?> myRecords(HttpServletRequest request,
                               @RequestParam(defaultValue = "1") int page,
                               @RequestParam(defaultValue = "10") int pageSize,
                               @RequestParam(required = false) String status) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.success(borrowService.getUserRecords(page, pageSize, userId, status));
    }
}
