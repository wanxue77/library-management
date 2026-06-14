package com.library.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.entity.Book;
import com.library.entity.BorrowRecord;
import com.library.mapper.BookMapper;
import com.library.mapper.BorrowRecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BookService {

    @Autowired
    private BookMapper bookMapper;
    @Autowired
    private BorrowRecordMapper borrowRecordMapper;

    public Page<Book> getBookPage(int page, int pageSize, String keyword, String category) {
        QueryWrapper<Book> wrapper = new QueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like("title", keyword)
                    .or().like("author", keyword)
                    .or().like("isbn", keyword));
        }
        if (category != null && !category.isEmpty()) {
            wrapper.eq("category", category);
        }
        wrapper.orderByDesc("create_time");
        return bookMapper.selectPage(new Page<>(page, pageSize), wrapper);
    }

    public Book getBookById(Long id) {
        return bookMapper.selectById(id);
    }

    public void addBook(Book book) {
        book.setAvailable(book.getTotal());
        bookMapper.insert(book);
    }

    public void updateBook(Book book) {
        Book exist = bookMapper.selectById(book.getId());
        if (book.getTotal() != null) {
            int borrowed = exist.getTotal() - exist.getAvailable();
            if (book.getTotal() < borrowed) {
                throw new RuntimeException("总数量不能小于已借出数量(" + borrowed + ")");
            }
            exist.setTotal(book.getTotal());
            exist.setAvailable(book.getTotal() - borrowed);
        }
        if (book.getTitle() != null) exist.setTitle(book.getTitle());
        if (book.getAuthor() != null) exist.setAuthor(book.getAuthor());
        if (book.getIsbn() != null) exist.setIsbn(book.getIsbn());
        if (book.getPublisher() != null) exist.setPublisher(book.getPublisher());
        if (book.getCategory() != null) exist.setCategory(book.getCategory());
        if (book.getDescription() != null) exist.setDescription(book.getDescription());
        if (book.getCoverUrl() != null) exist.setCoverUrl(book.getCoverUrl());
        bookMapper.updateById(exist);
    }

    public void deleteBook(Long id) {
        QueryWrapper<BorrowRecord> wrapper = new QueryWrapper<>();
        wrapper.eq("book_id", id).and(w -> w.eq("status", "BORROWED").or().eq("status", "OVERDUE"));
        if (borrowRecordMapper.selectCount(wrapper) > 0) {
            throw new RuntimeException("该书有未归还的借阅记录，无法删除");
        }
        bookMapper.deleteById(id);
    }
}
