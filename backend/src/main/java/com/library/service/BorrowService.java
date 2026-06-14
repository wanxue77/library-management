package com.library.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.entity.Book;
import com.library.entity.BorrowRecord;
import com.library.mapper.BookMapper;
import com.library.mapper.BorrowRecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class BorrowService {

    @Autowired
    private BorrowRecordMapper borrowRecordMapper;
    @Autowired
    private BookMapper bookMapper;

    @Transactional
    public void borrowBook(Long userId, Long bookId) {
        Book book = bookMapper.selectById(bookId);
        if (book == null) throw new RuntimeException("图书不存在");
        if (book.getAvailable() <= 0) throw new RuntimeException("该图书已全部借出");

        // 检查是否已经借了未还
        QueryWrapper<BorrowRecord> checkWrapper = new QueryWrapper<>();
        checkWrapper.eq("user_id", userId).eq("book_id", bookId)
                .and(w -> w.eq("status", "BORROWED").or().eq("status", "OVERDUE"));
        if (borrowRecordMapper.selectCount(checkWrapper) > 0) {
            throw new RuntimeException("您已借阅该书，请先归还");
        }

        // 使用原子更新防止超借
        int updated = bookMapper.updateAvailable(bookId, -1);
        if (updated == 0) throw new RuntimeException("该图书已全部借出");

        BorrowRecord record = new BorrowRecord();
        record.setUserId(userId);
        record.setBookId(bookId);
        record.setBorrowTime(LocalDateTime.now());
        record.setDueTime(LocalDateTime.now().plusDays(30));
        record.setStatus("BORROWED");
        record.setFineAmount(BigDecimal.ZERO);
        borrowRecordMapper.insert(record);
    }

    @Transactional
    public void returnBook(Long userId, Long recordId) {
        BorrowRecord record = borrowRecordMapper.selectById(recordId);
        if (record == null || !record.getUserId().equals(userId)) {
            throw new RuntimeException("借阅记录不存在");
        }
        if (!"BORROWED".equals(record.getStatus()) && !"OVERDUE".equals(record.getStatus())) {
            throw new RuntimeException("该记录已归还");
        }

        record.setReturnTime(LocalDateTime.now());
        record.setStatus("RETURNED");
        borrowRecordMapper.updateById(record);

        bookMapper.updateAvailable(record.getBookId(), 1);
    }

    @Transactional
    public void adminReturnBook(Long recordId) {
        BorrowRecord record = borrowRecordMapper.selectById(recordId);
        if (record == null) {
            throw new RuntimeException("借阅记录不存在");
        }
        if (!"BORROWED".equals(record.getStatus()) && !"OVERDUE".equals(record.getStatus())) {
            throw new RuntimeException("该记录已归还");
        }

        record.setReturnTime(LocalDateTime.now());
        record.setStatus("RETURNED");
        borrowRecordMapper.updateById(record);

        bookMapper.updateAvailable(record.getBookId(), 1);
    }

    public Page<BorrowRecord> getUserRecords(int page, int pageSize, Long userId, String status) {
        QueryWrapper<BorrowRecord> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        if (status != null && !status.isEmpty()) {
            wrapper.eq("status", status);
        }
        wrapper.orderByDesc("create_time");
        return borrowRecordMapper.selectPage(new Page<>(page, pageSize), wrapper);
    }

    public Page<BorrowRecord> getAllRecords(int page, int pageSize, String status, String keyword) {
        QueryWrapper<BorrowRecord> wrapper = new QueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            wrapper.eq("status", status);
        }
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.eq("user_id", keyword)
                    .or().eq("book_id", keyword));
        }
        wrapper.orderByDesc("create_time");
        return borrowRecordMapper.selectPage(new Page<>(page, pageSize), wrapper);
    }

    @Scheduled(cron = "0 0 2 * * ?")
    public void autoCheckOverdue() {
        checkOverdue();
    }

    public void checkOverdue() {
        QueryWrapper<BorrowRecord> wrapper = new QueryWrapper<>();
        wrapper.eq("status", "BORROWED").lt("due_time", LocalDateTime.now());
        borrowRecordMapper.selectList(wrapper).forEach(record -> {
            record.setStatus("OVERDUE");
            long days = ChronoUnit.DAYS.between(record.getDueTime(), LocalDateTime.now());
            record.setFineAmount(BigDecimal.valueOf(days * 0.5));
            borrowRecordMapper.updateById(record);
        });
    }
}
